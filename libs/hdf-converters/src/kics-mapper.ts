import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  data as KicsMappingData,
  KicsMappingEntry
} from './mappings/KicsToCciAndNistMappingData';
import {
  conditionallyProvideAttribute,
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

// One occurrence of a query, against a specific file and resource.
type KicsFile = {
  file_name?: string;
  similarity_id?: string;
  line?: number;
  resource_type?: string;
  resource_name?: string;
  issue_type?: string;
  search_key?: string;
  search_line?: number;
  search_value?: string;
  expected_value?: string;
  actual_value?: string;
  [property: string]: unknown;
};

// One query and every place it fired. KICS already groups its output this way,
// so a query maps onto one control and each occurrence onto one result.
type KicsQuery = {
  query_id?: string;
  query_name?: string;
  query_url?: string;
  severity?: string;
  platform?: string;
  cwe?: string;
  risk_score?: string | number;
  cloud_provider?: string;
  category?: string;
  experimental?: boolean;
  description?: string;
  description_id?: string;
  files?: KicsFile[];
  [property: string]: unknown;
};

type KicsReport = {
  queries: KicsQuery[];
  kics_version?: string;
  severity_counters?: Record<string, number>;
  total_counter?: number;
  files_scanned?: number;
  queries_total?: number;
  [property: string]: unknown;
};

const CWE_NIST_MAPPING = new CweNistMapping();

// KICS publishes five severities. Its SARIF output collapses CRITICAL and HIGH
// into `error`; converting the native format keeps them apart.
//
// No level maps to 0: impact 0.0 reports Not Applicable in HDF, which would
// drop the finding from the compliance score rather than rating it low.
// https://docs.kics.io/latest/results/
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['info', 0.1],
  ['trace', 0.1]
]);

const DEFAULT_IMPACT = 0.5;

// Records which tier answered, so a reviewed mapping stays distinguishable from
// a CWE-derived guess and from a static default.
//
// The per-query table is the authoritative source, matching how the Checkov and
// AWS Config mappers work: the rule-to-control decision is made and reviewed
// before shipping rather than computed at conversion time, which is also what
// lets those tables carry control enhancements. CWE is a fallback because it is
// a lossy proxy — KICS carries a CWE on all 1,811 of its shipped queries, but
// only 30 of the 102 distinct CWEs it uses resolve against CweNistMappingData,
// 52% of queries by volume.
const NIST_MAPPING_TAG = 'nistMapping';
const NIST_MAPPING_TABLE = 'mapped';
const NIST_MAPPING_CWE = 'cwe-derived';
const NIST_MAPPING_FALLBACK = 'static-fallback';

// KICS emits the bare number, e.g. "778".
function cweIdentifiers(query: KicsQuery): string[] {
  const raw = query.cwe;
  if (raw === undefined || raw === null) {
    return [];
  }
  const id = `${raw}`.trim().replace(/^CWE-/i, '');
  return /^\d+$/.test(id) ? [id] : [];
}

function impactMapping(query: KicsQuery): number {
  const severity = query.severity;
  if (!_.isString(severity) || severity.length === 0) {
    return DEFAULT_IMPACT;
  }
  return IMPACT_MAPPING.get(severity.toLowerCase()) ?? DEFAULT_IMPACT;
}

// Resolution order: the reviewed per-query table, then the query's CWE, then the
// static-analysis defaults. `table` is a parameter so the precedence is testable
// without shipping unreviewed rows in the table itself.
export function resolveControls(
  query: KicsQuery,
  table: Record<string, KicsMappingEntry> = KicsMappingData
): {nist: string[]; cci: string[]; source: string} {
  const entry = _.isString(query.query_id) ? table[query.query_id] : undefined;
  if (entry !== undefined && entry.nist.length > 0) {
    return {nist: entry.nist, cci: entry.cci, source: NIST_MAPPING_TABLE};
  }

  const fromCwe = CWE_NIST_MAPPING.nistFilter(cweIdentifiers(query), []);
  if (fromCwe.length > 0) {
    return {
      nist: fromCwe,
      cci: getCCIsForNISTTags(fromCwe),
      source: NIST_MAPPING_CWE
    };
  }

  const fallback = [...DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS];
  return {
    nist: fallback,
    cci: getCCIsForNISTTags(fallback),
    source: NIST_MAPPING_FALLBACK
  };
}

function formatCodeDesc(file: KicsFile): string {
  const parts = [`File: ${file.file_name ?? 'unknown'}`];
  if (typeof file.line === 'number' && file.line > 0) {
    parts.push(`Line: ${file.line}`);
  }
  if (file.resource_type) {
    parts.push(`Resource type: ${file.resource_type}`);
  }
  if (file.resource_name && file.resource_name !== 'unknown') {
    parts.push(`Resource: ${file.resource_name}`);
  }
  if (file.search_key) {
    parts.push(`Key: ${file.search_key}`);
  }
  return parts.join('\n');
}

// The remediation pair. KICS's SARIF keeps only actual_value inside its
// message, so a SARIF-derived control can say what the configuration is but
// never what it should be.
function formatMessage(file: KicsFile): string {
  const parts: string[] = [];
  if (file.expected_value) {
    parts.push(`Expected: ${file.expected_value}`);
  }
  if (file.actual_value) {
    parts.push(`Actual: ${file.actual_value}`);
  }
  if (file.issue_type) {
    parts.push(`Issue type: ${file.issue_type}`);
  }
  if (file.search_value) {
    parts.push(`Search value: ${file.search_value}`);
  }
  return parts.join('\n');
}

// KICS reports violations only. Its output carries no record of the queries that
// ran without finding anything — `queries` holds only those that fired — so no
// passing control can be derived from it, and a converted profile is
// failures-only by construction. That makes the compliance percentage
// misleading on its own: a scan where 72 of 2,034 queries fired renders as 100%
// failed. This control carries the denominator so the ratio is legible.
function formatCoverage(data: KicsReport): string {
  const fired = (data.queries ?? []).filter(
    (query) => (query.files ?? []).length > 0
  ).length;
  return (
    `KICS executed ${data.queries_total ?? 0} queries against ` +
    `${data.files_scanned ?? 0} file(s); ${fired} produced findings. ` +
    'KICS reports violations only and does not enumerate the queries that ran ' +
    'without finding anything, so no passing controls can be derived from its ' +
    'output and the compliance ratio should not be read as a pass rate.'
  );
}

function distinct(values: unknown[]): string[] {
  return [...new Set(values.filter(_.isString))];
}

export class KicsMapper extends BaseConverter<KicsReport> {
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
        name: 'KICS',
        title: 'KICS Infrastructure-as-Code Scan',
        version: {path: 'kics_version'},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            // One control per query: KICS metadata is query-scoped and
            // identical across occurrences, so only the location varies.
            path: 'queries',
            key: 'id',
            id: {path: 'query_id'},
            title: {path: 'query_name'},
            desc: {path: 'description'},
            impact: {transformer: impactMapping},
            refs: [
              {
                path: 'query_url',
                transformer: (url: unknown): Record<string, unknown> =>
                  _.isString(url) && url.length > 0 ? {url} : {}
              }
            ],
            source_location: {},
            code: '',
            tags: {
              transformer: (query: KicsQuery): Record<string, unknown> => {
                const {nist, cci, source} = resolveControls(query);
                const cwe = cweIdentifiers(query);
                const files = query.files ?? [];
                return {
                  nist,
                  cci,
                  [NIST_MAPPING_TAG]: source,
                  // Kept even when it does not resolve: an unmapped CWE that is
                  // invisible in the output is a gap nobody can see.
                  ...conditionallyProvideAttribute(
                    'cwe',
                    cwe.map((id) => `CWE-${id}`),
                    cwe.length > 0
                  ),
                  ...conditionallyProvideAttribute(
                    'severity',
                    query.severity,
                    _.isString(query.severity)
                  ),
                  ...conditionallyProvideAttribute(
                    'platform',
                    query.platform,
                    _.isString(query.platform)
                  ),
                  ...conditionallyProvideAttribute(
                    'cloud_provider',
                    query.cloud_provider,
                    _.isString(query.cloud_provider)
                  ),
                  ...conditionallyProvideAttribute(
                    'category',
                    query.category,
                    _.isString(query.category)
                  ),
                  ...conditionallyProvideAttribute(
                    'risk_score',
                    `${query.risk_score}`,
                    query.risk_score !== undefined
                  ),
                  ...conditionallyProvideAttribute(
                    'description_id',
                    query.description_id,
                    _.isString(query.description_id)
                  ),
                  ...conditionallyProvideAttribute(
                    'experimental',
                    true,
                    query.experimental === true
                  ),
                  ...conditionallyProvideAttribute(
                    'issue_type',
                    distinct(files.map((f) => f.issue_type)),
                    distinct(files.map((f) => f.issue_type)).length > 0
                  ),
                  ...conditionallyProvideAttribute(
                    'resource_type',
                    distinct(files.map((f) => f.resource_type)),
                    distinct(files.map((f) => f.resource_type)).length > 0
                  )
                };
              }
            },
            results: [
              {
                path: 'files',
                // KICS reports only violations; there is no passing or
                // suppressed state in its output to derive anything else from.
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                message: {transformer: formatMessage},
                start_time: ''
              }
            ]
          },
          {
            id: 'kics-scan-coverage',
            title: 'KICS scan coverage',
            // Impact 0 reports Not Applicable, so a record of scan context
            // cannot skew the compliance ratio it exists to explain.
            impact: 0,
            desc: {transformer: formatCoverage},
            refs: [],
            source_location: {},
            code: '',
            tags: {
              transformer: (data: KicsReport): Record<string, unknown> => ({
                queries_executed: data.queries_total ?? 0,
                queries_with_findings: (data.queries ?? []).filter(
                  (query) => (query.files ?? []).length > 0
                ).length,
                files_scanned: data.files_scanned ?? 0,
                files_parsed: data.files_parsed ?? 0
              })
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Passed,
                code_desc: {transformer: formatCoverage},
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: KicsReport): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'KICS',
              data: {
                kics_version: data.kics_version,
                severity_counters: data.severity_counters,
                total_counter: data.total_counter,
                files_scanned: data.files_scanned,
                queries_total: data.queries_total
              }
            }
          ],
          ...conditionallyProvideAttribute('raw', data, this.withRaw)
        };
      }
    }
  };

  constructor(kicsJson: string, withRaw = false) {
    super(JSON.parse(kicsJson) as KicsReport);
    this.withRaw = withRaw;
  }
}
