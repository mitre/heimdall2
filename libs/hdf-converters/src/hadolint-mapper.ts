import axios from 'axios';
import {ExecJSON} from 'inspecjs';
import MarkdownIt from 'markdown-it';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {HadolintNistMapping} from './mappings/HadolintNistMapping';
import {getCCIsForNISTTags} from './utils/global';

const HADOLINT_NIST_MAPPING = new HadolintNistMapping();

export const HadolintLevel = {
  Error: 'error',
  Warning: 'warning',
  Info: 'info',
  Style: 'style',
  Ignore: 'ignore',
  None: 'none'
} as const;

export type HadolintLevel =
  (typeof HadolintLevel)[keyof typeof HadolintLevel];

const IMPACT_MAPPING: Map<HadolintLevel, number> = new Map([
  [HadolintLevel.Error, 0.7],
  [HadolintLevel.Warning, 0.5],
  [HadolintLevel.Info, 0.3],
  [HadolintLevel.Style, 0.1],
  [HadolintLevel.Ignore, 0],
  [HadolintLevel.None, 0]
]);

export type HadolintFinding = {
  code: string;
  column: number;
  file: string;
  level: HadolintLevel;
  line: number;
  message: string;
};

type HadolintFindingWithDescription = HadolintFinding & {
  description: string;
};

const HADOLINT_WIKI_URL =
  'https://raw.githubusercontent.com/wiki/hadolint/hadolint';
const SHELLCHECK_WIKI_URL =
  'https://raw.githubusercontent.com/wiki/koalaman/shellcheck';
const markdownIt = new MarkdownIt();

function wikiUrl(code: string): string {
  const wikiBaseUrl = code.startsWith('SC')
    ? SHELLCHECK_WIKI_URL
    : HADOLINT_WIKI_URL;
  return `${wikiBaseUrl}/${code}.md`;
}

function extractRuleDescription(markdown: string): string {
  const lines = markdown.trim().split(/\r?\n/);
  const pageWithoutTitle = lines.slice(1).join('\n');
  return pageWithoutTitle ? markdownIt.render(pageWithoutTitle) : '';
}

async function fetchRuleDescription(code: string): Promise<string> {
  try {
    const {data} = await axios.get<string>(wikiUrl(code));
    return extractRuleDescription(data);
  } catch {
    return '';
  }
}

function nistTag(rule: string): string[] {
  return HADOLINT_NIST_MAPPING.nistTag(rule);
}

export class HadolintMapper {
  withRaw: boolean;
  findings: HadolintFinding[];
  includeRuleDescriptions: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: 'Hadolint Scan',
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'findings',
            key: 'id',
            id: {path: 'code'},
            title: {path: 'message'},
            tags: {
              nist: {path: 'code', transformer: nistTag},
              cci: {
                path: 'code',
                transformer: (rule: string) => getCCIsForNISTTags(nistTag(rule))
              }
            },
            refs: [],
            source_location: {},
            desc: {path: 'description'},
            impact: {
              path: 'level',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: (finding: HadolintFinding): string => `File: ${finding.file}\nLine: ${finding.line}\nColumn: ${finding.column}`},
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (): Record<string, unknown> => {
        return {
          ...(this.withRaw && {raw: this.findings})
        };
      }
    }
  };

  constructor(
    hadolintJson: string,
    withRaw = false,
    includeRuleDescriptions = false
  ) {
    this.withRaw = withRaw;
    this.findings = JSON.parse(hadolintJson) as HadolintFinding[];
    this.includeRuleDescriptions = includeRuleDescriptions;
  }

  async getRuleDescriptions(): Promise<Map<string, string>> {
    const descriptions = await Promise.all(
      [...new Set(this.findings.map((finding) => finding.code))].map(
        async (code) => [code, await fetchRuleDescription(code)] as const
      )
    );
    return new Map(descriptions);
  }

  async toHdf(): Promise<ExecJSON.Execution> {
    const descriptions = this.includeRuleDescriptions
      ? await this.getRuleDescriptions()
      : new Map<string, string>();
    const converter = new BaseConverter<{findings: HadolintFindingWithDescription[]}>(
      {
        findings: this.findings.map(
          (finding): HadolintFindingWithDescription => ({
            ...finding,
            description: descriptions.get(finding.code) ?? ''
          })
        )
      },
      true
    );
    converter.setMappings(this.mappings);
    return converter.toHdf();
  }
}
