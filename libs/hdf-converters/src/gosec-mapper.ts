import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  DEFAULT_PROFILE_FIELDS,
  impactMapping,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import { HeimdallToolsVersion } from './utils/global';

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING = new Map<string, number>([
  ['high', 0.7],
  ['low', 0.3],
  ['medium', 0.5],
]);

export class GosecMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              data: {
                'Golang errors': _.get(data, 'Golang errors'),
                Stats: _.get(data, 'Stats'),
              },
              name: 'gosec',
            },
          ],
          ...(this.withRaw && { raw: data }),
        };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    profiles: [
      {
        ...DEFAULT_PROFILE_FIELDS,
        controls: [
          {
            desc: '',
            id: { path: 'rule_id' },
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING),
            },
            key: 'id',
            path: 'Issues',
            refs: [],
            results: [
              {
                code_desc: { transformer: formatCodeDesc },
                message: { transformer: formatMessage },
                skip_message: { transformer: formatSkipMessage },
                start_time: '',
                status: { transformer: formatStatus },
              },
            ],
            source_location: {},
            tags: {
              cwe: { path: 'cwe' },
              nist: {
                path: 'cwe',
                transformer: nistTag,
              },
            },
            title: { path: 'details' },
          },
        ],
        name: 'gosec Scan',
        title: 'gosec Scan',
        version: { path: 'GosecVersion' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(gosecJson: string, withRaw = false) {
    super(JSON.parse(gosecJson));
    this.withRaw = withRaw;
  }
}

// Report gosec rule violation and violation location
function formatCodeDesc(input: Record<string, unknown>): string {
  return `Rule ${_.get(input, 'rule_id')} violation detected at:\nFile: ${_.get(input, 'file')}\nLine: ${_.get(input, 'line')}\nColumn: ${_.get(input, 'column')}`;
}

// Report confidence of violation and specific offending code
function formatMessage(input: Record<string, unknown>): string {
  return `${_.get(input, 'confidence')} confidence of rule violation at:\n${_.get(input, 'code')}`;
}

// If a gosec rule violation is suppressed, forward the given justification
function formatSkipMessage(input: Record<string, unknown>): string | undefined {
  const suppressions = _.get(input, 'suppressions');

  // If test is not skipped
  if (`${suppressions}` === 'null') {
    return undefined;
  }

  // If test is skipped and there are no justifications, report that none are given
  if (!Array.isArray(suppressions)) {
    return 'No justification provided';
  }
  // otherwise, supply the justifications
  return suppressions
    .map(
      suppression =>
        `${suppression.justification || 'No justification provided'} (${suppression.kind})`,
    )
    .join('\n');
}

// Check `nosec` and `suppressions` fields which denote whether the gosec rule violation should be suppressed/skipped
function formatStatus(input: Record<string, unknown>): string {
  return `${_.get(input, 'nosec')}` === 'false'
    && `${_.get(input, 'suppressions')}` === 'null'
    ? ExecJSON.ControlResultStatus.Failed
    : ExecJSON.ControlResultStatus.Skipped;
}

function nistTag(input: Record<string, unknown>): string[] {
  const cwe = [`${_.get(input, 'id')}`];
  return CWE_NIST_MAPPING.nistFilter(cwe, DEFAULT_NIST_TAG);
}
