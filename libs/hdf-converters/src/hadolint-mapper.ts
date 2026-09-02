import {ExecJSON} from 'inspecjs';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';

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

export class HadolintMapper extends BaseConverter<{findings: HadolintFinding[]}> {
  withRaw: boolean;

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
            tags: {},
            refs: [],
            source_location: {},
            desc: {path: 'message'},
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
      transformer: (data: {findings: HadolintFinding[]}): Record<string, unknown> => {
        return {
          ...(this.withRaw && {raw: data.findings})
        };
      }
    }
  };

  constructor(hadolintJson: string, withRaw = false) {
    super({findings: JSON.parse(hadolintJson) as HadolintFinding[]}, true);
    this.withRaw = withRaw;
  }
}
