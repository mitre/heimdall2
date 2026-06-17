import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter } from './base-converter';
import { data as MappingData } from './mappings/CheckovToCciAndNistMappingData';
import {
  conditionallyProvideAttribute,
  DEFAULT_STATIC_CODE_ANALYSIS_CCI_TAGS,
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  HeimdallToolsVersion,
} from './utils/global';

type CheckovCheck = {
  // Catch-all for remaining optional fields
  [property: string]: unknown;
  bc_category: null | string;
  bc_check_id: null | string;
  benchmarks: null | Record<string, unknown>;
  caller_file_line_range: null | number[];
  caller_file_path: null | string;
  check_class: string;
  // Always present, never null
  check_id: string;
  check_len: null | number;
  check_name: string;
  check_result: CheckovCheckResult;
  code_block: [number, string][];
  connected_node: null | Record<string, unknown>;
  definition_context_file_path: string;
  description: null | string;
  details: string[];
  entity_tags: null | Record<string, string>;
  evaluations: null | Record<string, unknown>;
  file_abs_path: string;
  file_line_range: number[];
  file_path: string;
  fixed_definition: null | string;
  guideline: null | string;
  repo_file_path: string;
  resource: string;
  resource_address: null | string;
  // Always present but can be null
  severity: null | string;
  short_description: null | string;
  vulnerability_details: null | Record<string, unknown>;
};

type CheckovCheckResult = {
  [property: string]: unknown;
  evaluated_keys: string[];
  result: 'FAILED' | 'PASSED' | 'SKIPPED' | 'UNKNOWN';
};

type CheckovReport = {
  check_type: string;
  results: {
    failed_checks: CheckovCheck[];
    parsing_errors: string[];
    passed_checks: CheckovCheck[];
    skipped_checks: CheckovCheck[];
  };
  summary: CheckovSummary;
  url: string;
};

type CheckovSummary = {
  checkov_version: string;
  failed: number;
  parsing_errors: number;
  passed: number;
  resource_count: number;
  skipped: number;
};

// https://github.com/bridgecrewio/checkov/blob/main/checkov/common/bridgecrew/severities.py
// severity scale (score → HDF impact):
//   CRITICAL: 5 → 1.0
//   HIGH/IMPORTANT: 4 → 0.8
//   MEDIUM/MODERATE: 3 → 0.6
//   LOW: 2 → 0.4
//   INFO: 1 → 0.2
//   NONE: -999 → 0.0
//   OFF: 999 -> MEDIUM
//   null (no API Key) → MEDIUM
// Severity is only populated when passing in an API key via --bc-api-key, otherwise it is null
// Default to medium - treat null/unknown risk as moderate until a formal risk assessment is performed.
const MEDIUM_SEVERITY = 0.6;
const IMPACT_MAPPING = new Map<string, number>([
  ['critical', 1],
  ['high', 0.8],
  ['important', 0.8],
  ['info', 0.2],
  ['low', 0.4],
  ['medium', MEDIUM_SEVERITY],
  ['moderate', 0.6],
  ['none', 0],
]);

export class CheckovMapper extends BaseConverter<CheckovReport> {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (
        data: CheckovReport,
      ): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              data: {
                summary: data.summary,
                url: data.url,
              },
              name: 'Checkov',
            },
          ],
          ...conditionallyProvideAttribute('raw', data, this.withRaw),
        };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            path: 'results.passed_checks',
            ...this.controlMapping(),
          },
          {
            path: 'results.failed_checks',
            ...this.controlMapping(),
          },
          {
            path: 'results.skipped_checks',
            ...this.controlMapping(),
          },
          ...(this.data.results.parsing_errors.length === 0
            ? []
            : [{
              id: 'Parsing Errors',
              impact: MEDIUM_SEVERITY,
              refs: [],
              results: [{
                code_desc: { transformer: parsingError => parsingError },
                path: 'results.parsing_errors',
                start_time: '',
                status: 'error',
              }],
              source_location: {},
              tags: {},
            } as MappedTransform<ExecJSON.Control & ILookupPath, ILookupPath>]),
        ],
        groups: [],
        name: 'Checkov',
        sha256: '',
        status: 'loaded',
        supports: [],
        title: {
          path: 'check_type',
          transformer: (checkType): string => `Bridgecrew (by Prisma Cloud) Checkov ${checkType} Security Scan`,
        },
        version: { path: 'summary.checkov_version' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(checkovJson: string, withRaw = false) {
    super(JSON.parse(checkovJson) as CheckovReport);
    this.withRaw = withRaw;
  }

  controlMapping(): MappedTransform<
  ExecJSON.Control & ILookupPath,
  ILookupPath
  > {
    return {
      code: { transformer: formatCode },
      desc: { path: 'description' },
      id: { transformer: (check: CheckovCheck): string => `${check.check_id}\n${check.resource}` },
      impact: { path: 'severity', transformer: impactMapping },
      key: 'id',
      refs: [
        {
          path: 'guideline',
          transformer: (guideline) => {
            if (_.isString(guideline) && guideline.length > 0) {
              return { url: guideline };
            }
            return {};
          },
        },
      ],
      results: [
        {
          code_desc: { transformer: formatCodeDesc },
          message: {
            transformer: (check: CheckovCheck): string => {
              const parts = Object.entries(_.omit(check.check_result, ['result'])).map(([key, value]) => `${_.startCase(key)}: ${(value === null || value === undefined || typeof value !== 'object') ? String(value) : JSON.stringify(value, null, 2)}`);
              parts.push(
                `Repo File Path: ${check.repo_file_path}`,
                `File Abs Path: ${check.file_abs_path}`,
              );
              if (check.fixed_definition) {
                const fix: string = _.isString(check.fixed_definition) ? check.fixed_definition : JSON.stringify(check.fixed_definition, null, 2);
                parts.push(`Fixed Definition: ${fix}`);
              }
              if (check.fixed_definition) {
                const fix: string = _.isString(check.fixed_definition) ? check.fixed_definition : JSON.stringify(check.fixed_definition, null, 2);
                parts.push(`Fixed Definition: ${fix}`);
              }
              if (check.vulnerability_details) {
                const vulnDetails: string = JSON.stringify(check.vulnerability_details, null, 2);
                parts.push(`Vulnerability Details: ${vulnDetails}`);
              }
              return parts.join('\n');
            },
          },
          start_time: '',
          status: { path: 'check_result.result', transformer: statusMapper },
        },
      ],
      source_location: {},
      tags: {
        cci: {
          path: 'check_id',
          transformer: (checkId: CheckovCheck['check_id']): string[] => {
            const mapping = MappingData[checkId];
            return mapping ? mapping.cci : DEFAULT_STATIC_CODE_ANALYSIS_CCI_TAGS;
          },
        },
        check_class: { path: 'check_class' },
        checkov_id: { path: 'check_id' },
        nist: {
          path: 'check_id',
          transformer: (checkId: CheckovCheck['check_id']): string[] => {
            const mapping = MappingData[checkId];
            return mapping ? mapping.nist : DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
          },
        },
        resource: { path: 'resource' },
        severity: { path: 'severity' },
      },
      title: {
        transformer: (check: CheckovCheck): string => {
          const shortDescription = check.short_description ? `: ${check.short_description}` : '';
          return `${check.check_name}${shortDescription}`;
        },
      },
    };
  }
}

function formatCode(check: CheckovCheck): string {
  const unmapped = _.omit(check, ['check_id', 'check_name', 'check_result', 'file_path', 'file_line_range', 'resource', 'code_block', 'check_class', 'file_abs_path', 'repo_file_path', 'severity', 'guideline', 'description', 'short_description', 'vulnerability_details', 'fixed_definition']);

  return JSON.stringify(unmapped, null, 2);
}

function formatCodeDesc(check: CheckovCheck): string {
  const resource = `Resource: ${check.resource}`;
  const fileLocation = `File: ${check.file_path}:${check.file_line_range[0]}-${check.file_line_range[1]}`;
  const codeBlockInner = check.code_block.map(([line, code]) => `${line}: ${code}`).join('').trim();
  const codeBlock = `<pre>${codeBlockInner}</pre>`;
  return `${resource}\n${fileLocation}\n${check.code_block.length === 0 ? '' : codeBlock}`;
}

function impactMapping(severity: CheckovCheck['severity']): number {
  if (_.isString(severity)) {
    return IMPACT_MAPPING.get(severity.toLowerCase()) ?? MEDIUM_SEVERITY;
  }
  // Checkov native JSON default severity is null (no API key) → default to medium
  return MEDIUM_SEVERITY;
}

function statusMapper(result: CheckovCheckResult['result']): ExecJSON.ControlResultStatus {
  if (result === 'PASSED') {
    return ExecJSON.ControlResultStatus.Passed;
  } else if (result === 'FAILED') {
    return ExecJSON.ControlResultStatus.Failed;
  }
  return ExecJSON.ControlResultStatus.Skipped;
}
