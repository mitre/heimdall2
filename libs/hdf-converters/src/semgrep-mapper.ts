import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  conditionallyProvideAttribute,
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

type SemgrepPosition = {
  line: number;
  col: number;
  offset: number;
  [property: string]: unknown;
};

// Rule-level metadata from the Semgrep registry. Every field is optional -- a
// locally written rule may supply none of it. Several are documented as arrays
// but arrive as bare strings when the rule declares a single value, so anything
// list-shaped is typed as string[] | string and normalized on read.
type SemgrepMetadata = {
  cwe?: string[] | string;
  owasp?: string[] | string;
  references?: string[] | string;
  subcategory?: string[] | string;
  technology?: string[] | string;
  vulnerability_class?: string[] | string;
  confidence?: string;
  likelihood?: string;
  impact?: string;
  category?: string;
  source?: string;
  shortlink?: string;
  license?: string;
  'source-rule-url'?: string;
  'bandit-code'?: string;
  asvs?: {
    control_id?: string;
    control_url?: string;
    section?: string;
    version?: string;
  };
  [property: string]: unknown;
};

type SemgrepExtra = {
  // Always present
  message: string;
  metadata: SemgrepMetadata;
  severity: string;
  // Present but redacted to the literal string 'requires login' unless the scan
  // is authenticated against the Semgrep AppSec Platform
  lines?: string;
  fingerprint?: string;
  // Only present when the rule ships an autofix
  fix?: string;
  engine_kind?: string;
  validation_state?: string;
  [property: string]: unknown;
};

type SemgrepResult = {
  check_id: string;
  path: string;
  start: SemgrepPosition;
  end: SemgrepPosition;
  extra: SemgrepExtra;
  [property: string]: unknown;
};

// `type` is a heterogeneous array -- a discriminant string followed by an
// optional payload, e.g. ['PartialParsing', [{path, start, end}]]. It is read
// only for its discriminant.
type SemgrepError = {
  message: string;
  code?: number;
  level?: string;
  type?: unknown;
  path?: string;
  spans?: unknown[];
  [property: string]: unknown;
};

type SemgrepReport = {
  results: SemgrepResult[];
  errors: SemgrepError[];
  version?: string;
  paths?: {scanned?: string[]; skipped?: unknown[]};
  skipped_rules?: unknown[];
  engine_requested?: string;
  [property: string]: unknown;
};

const CWE_NIST_MAPPING = new CweNistMapping();

// Semgrep's OSS severities are a three-level scale; its supply-chain rules add a
// four-level one. Both are mapped so a mixed scan does not fall through.
// https://semgrep.dev/docs/writing-rules/rule-syntax#required
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['error', 0.7],
  ['high', 0.7],
  ['warning', 0.5],
  ['medium', 0.5],
  ['info', 0.3],
  ['low', 0.3]
]);

// An unrecognized severity is treated as moderate rather than zero: impact 0.0
// reports Not Applicable in HDF, which would silently drop the finding from the
// compliance score.
const DEFAULT_IMPACT = 0.5;

// Fields Semgrep redacts in unauthenticated (OSS) scans. Mapping them verbatim
// would put this placeholder in front of every reader.
const REDACTED_PLACEHOLDER = 'requires login';

function isPresent(value: unknown): value is string {
  return (
    _.isString(value) && value.length > 0 && value !== REDACTED_PLACEHOLDER
  );
}

// Metadata fields documented as arrays arrive as bare strings when the rule
// declares a single value.
function normalizeToArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(_.isString);
  }
  return _.isString(value) ? [value] : [];
}

// Semgrep emits CWEs in prose form -- 'CWE-89: Improper Neutralization of ...'
// -- while the NIST mapping keys on the bare number.
function extractCweIds(metadata: SemgrepMetadata): string[] {
  return normalizeToArray(metadata.cwe)
    .map((entry) => /CWE-(\d+)/i.exec(entry)?.[1])
    .filter(isPresent);
}

function nistTags(result: SemgrepResult): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    extractCweIds(result.extra.metadata),
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

function impactMapping(result: SemgrepResult): number {
  const severity = result.extra.severity;
  if (!_.isString(severity)) {
    return DEFAULT_IMPACT;
  }
  return IMPACT_MAPPING.get(severity.toLowerCase()) ?? DEFAULT_IMPACT;
}

// Semgrep rule ids are dotted paths whose last segment is the rule name, which
// the registry repeats as the trailing component. There is no human-readable
// rule title anywhere in the JSON output -- unlike the SARIF output, whose rule
// objects carry `name` and `shortDescription` -- so one is derived here.
function formatTitle(result: SemgrepResult): string {
  const segments = result.check_id.split('.').filter((s) => s.length > 0);
  const ruleName = segments[segments.length - 1] ?? result.check_id;
  return _.startCase(ruleName.replace(/[-_]/g, ' '));
}

function formatCodeDesc(result: SemgrepResult): string {
  const {start, end} = result;
  const span =
    start.line === end.line
      ? `line ${start.line}, columns ${start.col}-${end.col}`
      : `lines ${start.line}-${end.line}`;
  return `Path: ${result.path}\nLocation: ${span}`;
}

function formatMessage(result: SemgrepResult): string | undefined {
  const parts: string[] = [];
  if (isPresent(result.extra.lines)) {
    parts.push(`Matched code:\n${result.extra.lines}`);
  }
  // `fix` is the replacement text for the matched span, not a standalone
  // instruction -- rendering it bare produces messages like 'Suggested fix:
  // False', which reads as nonsense without saying what it replaces.
  if (isPresent(result.extra.fix)) {
    parts.push(
      `Suggested fix -- replace the matched code with:\n${result.extra.fix}`
    );
  }
  return parts.length === 0 ? undefined : parts.join('\n\n');
}

// Documentation and cross-framework links. Deduplicated because the registry
// routinely repeats a rule's source URL inside its references list.
function collectRefUrls(result: SemgrepResult): string[] {
  const metadata = result.extra?.metadata ?? {};
  const urls = [
    ...normalizeToArray(metadata.references),
    metadata.source,
    metadata.shortlink,
    metadata['source-rule-url'],
    metadata.asvs?.control_url
  ].filter(isPresent);
  return [...new Set(urls)];
}

// Per-finding fields with no dedicated HDF home. Anything mapped elsewhere is
// omitted so this carries only what would otherwise be dropped.
function formatCode(result: SemgrepResult): string {
  const extra = _.omitBy(
    _.omit(result.extra, [
      'message',
      'metadata',
      'severity',
      'lines',
      'fix',
      'engine_kind'
    ]),
    (value) => value === REDACTED_PLACEHOLDER
  );
  const unmapped = {
    ..._.omit(result, ['check_id', 'path', 'start', 'end', 'extra']),
    ...(_.isEmpty(extra) ? {} : {extra})
  };
  // An empty string keeps the field out of the reader's way; a JSON object
  // holding nothing but redacted placeholders is worse than no code block.
  return _.isEmpty(unmapped) ? '' : JSON.stringify(unmapped, null, 2);
}

export class SemgrepMapper extends BaseConverter<SemgrepReport> {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: 'Semgrep',
        title: 'Semgrep Static Analysis Scan',
        version: {path: 'version'},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'results',
            // One control per rule: every Semgrep finding for a given check_id
            // shares that rule's metadata, so only the location varies and the
            // occurrences collapse into results under a single control.
            key: 'id',
            id: {path: 'check_id'},
            title: {transformer: formatTitle},
            desc: {path: 'extra.message'},
            impact: {transformer: impactMapping},
            refs: [
              {
                // A path is required for the array handler to expand one entry
                // into many, so `extra` is read only as an anchor; pathTransform
                // replaces it with the URL list gathered from the whole finding,
                // and the transformer then shapes each URL into a reference.
                path: 'extra',
                pathTransform: (_extra: unknown, file: unknown): string[] =>
                  collectRefUrls(file as SemgrepResult),
                transformer: (url: unknown): {url: string} => ({
                  url: String(url)
                })
              }
            ],
            code: {transformer: formatCode},
            source_location: {},
            tags: {
              transformer: (result: SemgrepResult): Record<string, unknown> => {
                const metadata = result.extra.metadata;
                const nist = nistTags(result);
                return {
                  nist,
                  cci: getCCIsForNISTTags(nist),
                  cwe: normalizeToArray(metadata.cwe),
                  ...conditionallyProvideAttribute(
                    'owasp',
                    normalizeToArray(metadata.owasp),
                    normalizeToArray(metadata.owasp).length > 0
                  ),
                  ...conditionallyProvideAttribute(
                    'confidence',
                    metadata.confidence,
                    isPresent(metadata.confidence)
                  ),
                  ...conditionallyProvideAttribute(
                    'likelihood',
                    metadata.likelihood,
                    isPresent(metadata.likelihood)
                  ),
                  // Renamed: Semgrep's metadata.impact rates the severity of the
                  // consequence, which is not what HDF's impact float means.
                  ...conditionallyProvideAttribute(
                    'semgrep_impact',
                    metadata.impact,
                    isPresent(metadata.impact)
                  ),
                  ...conditionallyProvideAttribute(
                    'category',
                    metadata.category,
                    isPresent(metadata.category)
                  ),
                  ...conditionallyProvideAttribute(
                    'subcategory',
                    normalizeToArray(metadata.subcategory),
                    normalizeToArray(metadata.subcategory).length > 0
                  ),
                  ...conditionallyProvideAttribute(
                    'technology',
                    normalizeToArray(metadata.technology),
                    normalizeToArray(metadata.technology).length > 0
                  ),
                  ...conditionallyProvideAttribute(
                    'vulnerability_class',
                    normalizeToArray(metadata.vulnerability_class),
                    normalizeToArray(metadata.vulnerability_class).length > 0
                  ),
                  ...conditionallyProvideAttribute(
                    'asvs',
                    metadata.asvs,
                    _.isObject(metadata.asvs)
                  ),
                  ...conditionallyProvideAttribute(
                    'bandit_code',
                    metadata['bandit-code'],
                    isPresent(metadata['bandit-code'])
                  ),
                  ...conditionallyProvideAttribute(
                    'engine_kind',
                    result.extra.engine_kind,
                    isPresent(result.extra.engine_kind)
                  ),
                  check_id: result.check_id,
                  severity: result.extra.severity
                };
              }
            },
            results: [
              {
                // Semgrep reports only violations. Findings suppressed with a
                // `nosemgrep` comment are omitted from the output entirely
                // rather than flagged, so no skipped status is derivable.
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                message: {transformer: formatMessage},
                start_time: ''
              }
            ]
          },
          // Scan-time failures are reported as their own control so they are
          // visible in Heimdall rather than buried in passthrough. Present only
          // when the scan actually produced errors.
          ...(this.data.errors.length === 0
            ? []
            : [
                {
                  id: 'Semgrep Scan Errors',
                  title: 'Semgrep Scan Errors',
                  desc: 'Errors reported by Semgrep while scanning. A file that failed to parse was not fully analyzed, so absence of findings in it is not evidence of compliance.',
                  impact: DEFAULT_IMPACT,
                  refs: [],
                  source_location: {},
                  tags: {
                    nist: DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
                    cci: getCCIsForNISTTags(
                      DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
                    )
                  },
                  results: [
                    {
                      path: 'errors',
                      // Semgrep reports the same parse failure once per rule
                      // that tripped over it, so identical records repeat.
                      pathTransform: (errors: unknown): SemgrepError[] =>
                        _.uniqBy(
                          errors as SemgrepError[],
                          (error) => `${error.path}|${error.message}`
                        ),
                      status: ExecJSON.ControlResultStatus.Error,
                      code_desc: {
                        transformer: (error: SemgrepError): string =>
                          `Path: ${_.get(error, 'path', 'unknown')}`
                      },
                      message: {
                        transformer: (error: SemgrepError): string => {
                          const kind = Array.isArray(error.type)
                            ? String(error.type[0])
                            : String(error.type ?? 'Unknown');
                          return `${kind}: ${error.message}`;
                        }
                      },
                      start_time: ''
                    }
                  ]
                } as MappedTransform<
                  ExecJSON.Control & ILookupPath,
                  ILookupPath
                >
              ])
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: SemgrepReport): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'Semgrep',
              data: {
                version: data.version,
                engine_requested: data.engine_requested,
                paths: data.paths,
                skipped_rules: data.skipped_rules
              }
            }
          ],
          ...conditionallyProvideAttribute('raw', data, this.withRaw)
        };
      }
    }
  };

  constructor(semgrepJson: string, withRaw = false) {
    super(JSON.parse(semgrepJson) as SemgrepReport);
    this.withRaw = withRaw;
  }
}
