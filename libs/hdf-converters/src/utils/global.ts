import type {
  ContextualizedEvaluation,
  ExecJSON,
} from 'inspecjs';
import { contextualizeEvaluation } from 'inspecjs';
import * as _ from 'lodash';
import { createLogger, format, transports } from 'winston';
import packageJson from '../../package.json';
import { data as NistCciMappingData } from '../mappings/NistCciMappingData';

export const HeimdallToolsVersion: string = packageJson.version;

const NIST_BASE_TAG_RE = /\w{2}-\d{1,3}/v;

// DEFAULT_NIST_TAG is applicable to all automated configuration tests.
// SA-11 (DEVELOPER SECURITY TESTING AND EVALUATION) - RA-5 (VULNERABILITY SCANNING)
export const DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS = ['SA-11', 'RA-5'];

export const DEFAULT_STATIC_CODE_ANALYSIS_CCI_TAGS
  = DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS.flatMap(tag => NistCciMappingData[tag]);

// REMEDIATION_NIST_TAG the set of default applicable NIST 800-53 controls for ensuring up-to-date packages.
// SI-2 (FLAW REMEDIATION) - RA-5 (VULNERABILITY SCANNING)
export const DEFAULT_UPDATE_REMEDIATION_NIST_TAGS = ['SI-2', 'RA-5'];

// Applicable to dependency management
export const DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS = [
  'CM-8',
];

// The "Types" field of ASFF only supports a maximum of 2 slashes, and will get replaced with this text. Note that the default AWS CLI doesn't support UTF-8 encoding
export const FROM_ASFF_TYPES_SLASH_REPLACEMENT = /\{\{\{slash\}\}\}/giv;

// Using the spread operator on a falsy value within an object does nothing.  It is possible to use that syntactic behavior to conditionally add attributes to an object by writing something as follows: {...(condition && {attributeName: attribute})} which returns {} if condition is falsy and {attributeName: attribute} otherwise.  Use this function to replace the stuff in the parentheses to save cognitive complexity marks when sonarqube complains.
export function conditionallyProvideAttribute(
  attributeName: string,
  attribute: unknown,
  condition: boolean,
): Record<string, unknown> | undefined {
  if (!condition) {
    return undefined;
  }
  return { [attributeName]: attribute };
}

export function createWinstonLogger(mapperName: string, level = 'debug') {
  return createLogger({
    format: format.combine(
      format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss Z' }),
      format.printf(
        info => `[${[info.timestamp]}] ${mapperName} ${info.message}`,
      ),
    ),
    level: level,
    transports: [new transports.Console()],
  });
}

export function ensureContextualizedEvaluation(
  data: ContextualizedEvaluation | ExecJSON.Execution,
) {
  return 'contains' in data ? data : contextualizeEvaluation(data);
}

// Return original string if it exists, else return undefined
export function filterString(input: string): string | undefined {
  return input || undefined;
}

export function getCCIsForNISTTags(nistTags: string[]): string[] {
  const cciTags: string[] = [];
  for (const nistTag of nistTags) {
    const baseTag = NIST_BASE_TAG_RE.exec(nistTag);
    if (
      Array.isArray(baseTag)
      && baseTag.length > 0
      && baseTag[0] in NistCciMappingData
    ) {
      cciTags.push(...NistCciMappingData[baseTag[0]]);
    }
  }
  return cciTags;
}

/** Get description from Array of descriptions or Key/Value pairs */
export function getDescription(
  descriptions:
    | ExecJSON.ControlDescription[]
    | Record<string, string>,
  key: string,
): string | undefined {
  const found: string | undefined = Array.isArray(descriptions)
    ? descriptions.find(
      (description: ExecJSON.ControlDescription) =>
        description.label.toLowerCase() === key,
    )?.data
    : _.get(descriptions, key);

  return found;
}
