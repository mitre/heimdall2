import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import winston from 'winston';

export function createWinstonLogger(
  mapperName: string,
  level = 'debug'
): winston.Logger {
  return winston.createLogger({
    transports: [new winston.transports.Console()],
    level: level,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss Z'
      }),
      winston.format.printf(
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
