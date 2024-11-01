import {
  ContextualizedEvaluation,
  contextualizeEvaluation,
  ExecJSON
} from 'inspecjs';
import * as _ from 'lodash';
import {createLogger, format, transports} from 'winston';
import {data as NistCciMappingData} from '../mappings/NistCciMappingData';

// DEFAULT_NIST_TAG is applicable to all automated configuration tests.
// SA-11 (DEVELOPER SECURITY TESTING AND EVALUATION) - RA-5 (VULNERABILITY SCANNING)
export const DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS = ['SA-11', 'RA-5'];

export const DEFAULT_STATIC_CODE_ANALYSIS_CCI_TAGS =
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS.map((tag) => NistCciMappingData[tag]);

// REMEDIATION_NIST_TAG the set of default applicable NIST 800-53 controls for ensuring up-to-date packages.
// SI-2 (FLAW REMEDIATION) - 	RA-5 (VULNERABILITY SCANNING)
export const DEFAULT_UPDATE_REMEDIATION_NIST_TAGS = ['SI-2', 'RA-5'];

// Applicable to dependency management
export const DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS = [
  'CM-8'
];

// The "Types" field of ASFF only supports a maximum of 2 slashes, and will get replaced with this text. Note that the default AWS CLI doesn't support UTF-8 encoding
export const FROM_ASFF_TYPES_SLASH_REPLACEMENT = /{{{SLASH}}}/gi;

export function createWinstonLogger(mapperName: string, level = 'debug') {
  return createLogger({
    transports: [new transports.Console()],
    level: level,
    format: format.combine(
      format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss Z'
      }),
      format.printf(
        (info) => `[${[info.timestamp]}] ${mapperName} ${info.message}`
      )
    )
  });
}

/** Get description from Array of descriptions or Key/Value pairs */
export function getDescription(
  descriptions:
    | {
        [key: string]: string;
      }
    | ExecJSON.ControlDescription[],
  key: string
): string | undefined {
  let found: string | undefined;
  if (Array.isArray(descriptions)) {
    found = descriptions.find(
      (description: ExecJSON.ControlDescription) =>
        description.label.toLowerCase() === key
    )?.data;
  } else {
    found = _.get(descriptions, key);
  }

  return found;
}

// Using the spread operator on a falsy value within an object does nothing.  It is possible to use that syntactic behavior to conditionally add attributes to an object by writing something as follows: {...(condition && {attributeName: attribute})} which returns {} if condition is falsy and {attributeName: attribute} otherwise.  Use this function to replace the stuff in the parentheses to save cognitive complexity marks when sonarqube complains.
export function conditionallyProvideAttribute(
  attributeName: string,
  attribute: unknown,
  condition: boolean
): Record<string, unknown> | undefined {
  if (!condition) {
    return undefined;
  }
  return {[attributeName]: attribute};
}

export function ensureContextualizedEvaluation(
  data: ExecJSON.Execution | ContextualizedEvaluation
) {
  if ('contains' in data) {
    return data;
  } else {
    return contextualizeEvaluation(data);
  }
}

// Return original string if it exists, else return undefined
export function filterString(input: string): string | undefined {
  return input || undefined;
}
