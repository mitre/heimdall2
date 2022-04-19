import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {createLogger, transports, format} from 'winston';

// DEFAULT_NIST_TAG is applicable to all automated configuration tests.
// SA-11 (DEVELOPER SECURITY TESTING AND EVALUATION) - RA-5 (VULNERABILITY SCANNING)
export const DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS = ['SA-11', 'RA-5'];

// The "Types" field of ASFF only supports a maximum of 2 slashes, and will get replaced with this text. Note that the default AWS CLI doesn't support UTF-8 encoding
export const FROM_ASFF_TYPES_SLASH_REPLACEMENT = /{{{SLASH}}}/gi;

export function createWinstonLogger(
  mapperName: string,
  level = 'debug'
) {
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
