import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
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

export function getCCIsForNISTTags(nistTags: string[]): string[] {
  const cciTags: string[] = [];
  for (const nistTag of nistTags) {
    const baseTag = /\w\w-\d\d?\d?/g.exec(nistTag);
    if (baseTag && baseTag[0] in NistCciMappingData) {
      cciTags.push(...NistCciMappingData[nistTag]);
    }
  }
  return cciTags;
}
