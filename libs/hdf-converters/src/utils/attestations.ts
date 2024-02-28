import * as XLSX from '@e965/xlsx';
import {ExecJSON} from 'inspecjs';
import {
  AttestationData,
  ControlResultStatus
} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import * as _ from 'lodash';
import moment from 'moment';
import ms from 'ms';

export type Attestation = {
  control_id: string;
  explanation: string;
  frequency: string;
  status: 'passed' | 'failed';
  updated: string;
  updated_by: string;
};

export function advanceDate(
  date: moment.Moment,
  frequency: string
): moment.Moment {
  switch (frequency) {
    case 'annually':
      date.add(1, 'year');
      break;
    case 'semiannually':
      date.add(6, 'months');
      break;
    case 'quarterly':
      date.add(3, 'months');
      break;
    case 'monthly':
      date.add(1, 'month');
      break;
    case 'every2weeks':
      date.add(2, 'weeks');
      break;
    case 'fortnightly':
      date.add(2, 'weeks');
      break;
    case 'weekly':
      date.add(1, 'week');
      break;
    case 'every3days':
      date.add(3, 'day');
      break;
    case 'daily':
      date.add(1, 'day');
      break;
    default:
      const match = frequency.match(/(\d+(?:\.\d+)?)([a-z]+)/);
      
      if (!match){ throw new Error('Unknown date format: '+frequency); };

      const number = match[1];
      const unit = match[2];

      switch (match[2]) {
        case 'd':
          date.add(match[1], 'days');
          break;
        case 'wk':
          date.add(match[1], 'weeks');
          break;
        case 'm':
          date.add(match[1], 'months');
          break;
        case 'yr':
          date.add(match[1], 'years');
          break;
      }
      break;
  }
  return date;
}

export function createAttestationMessage(
  attestation: Attestation,
  expired: boolean
) {
  let message = '';

  if (expired) {
    message += 'Expired Attestation:\n';
    message += `Expired Status: ${attestation.status}\n`;
    message += `Expired Explanation: ${attestation.explanation}\n\n`;
  } else {
    message += 'Attestation:\n';
    message += `Status: ${attestation.status}\n`;
    message += `Explanation: ${attestation.explanation}\n\n`;
  }

  message += `Updated: ${attestation.updated}\n`;
  message += `Updated By: ${attestation.updated_by}\n`;
  message += `Frequency: ${attestation.frequency}`;

  return message;
}

export function convertAttestationToSegment(
  attestation: Attestation
): ExecJSON.ControlResult {
  const expirationDate = advanceDate(
    moment(attestation.updated),
    attestation.frequency
  );

  if (expirationDate.isBefore(new Date())) {
    console.log(
      `Warning: Attestation Expired: ${
        attestation.control_id
      } (Expired at ${expirationDate.toString()})`
    );
    return {
      code_desc:
        'Manual verification status provided through attestation has expired',
      status: ExecJSON.ControlResultStatus.Skipped,
      message: createAttestationMessage(attestation, true),
      start_time: new Date().toISOString()
    };
  } else {
    return {
      code_desc: 'Manually verified status provided through attestation',
      status: attestation.status as ControlResultStatus,
      message: createAttestationMessage(attestation, false),
      start_time: new Date().toISOString()
    };
  }
}

export function addAttestationToHDF(
  hdf: ExecJSON.Execution,
  attestations: Attestation[]
): ExecJSON.Execution {
  for (const profile of hdf.profiles) {
    for (const control of profile.controls) {
      for (const attestation of attestations) {
        if (attestation.control_id.toLowerCase() === control.id.toLowerCase()) {
          if (['passed', 'failed'].includes(attestation.status)) {
            // Attestation status is expecting type enum Status (failed, passed), however we just have a string status which can only be (failed or passed)
            control.attestation_data =
              attestation as unknown as AttestationData;
            control.results.push(convertAttestationToSegment(attestation));
          } else {
            console.error(
              `Invalid attestation status for Control ${control.id}: ${attestation.status} - Status must be passed or failed. To make this control 'not applicable', use a waiver.`
            );
          }
        }
      }
    }
  }

  return hdf;
}

export async function parseXLSXAttestations(
  attestationXLSX: Uint8Array
): Promise<Attestation[]> {
  return new Promise((resolve) => {
    const workbook = XLSX.read(attestationXLSX, {
      cellDates: true
    });
    const sheet = workbook.Sheets['attestations'];
    const data: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
    const attestations: Attestation[] = data.map((attestation) => {
      const lowerAttestation = _.mapKeys(attestation, (_v, k) => {
        return k.toLowerCase().replace(/\s/g, '_');
      });
      return {
        control_id: getFirstPath(lowerAttestation, [
          'control_id',
          'id',
          'control'
        ]),
        explanation: getFirstPath(lowerAttestation, ['explanation', 'explain']),
        frequency: getFirstPath(lowerAttestation, ['frequency']),
        status: getFirstPath(lowerAttestation, ['status']),
        updated: getFirstPath(lowerAttestation, ['updated', 'updated_at']),
        updated_by: getFirstPath(lowerAttestation, ['updated_by'])
      } as Attestation;
    });
    resolve(attestations);
  });
}

function getFirstPath(
  object: Record<string, unknown>,
  paths: string[]
): string {
  const index = _.findIndex(paths, (p) => hasPath(object, p));

  if (index === -1) {
    throw new Error(
      `Attestation is missing one of these paths: ${paths.join(', ')}`
    );
  } else {
    return _.get(object, paths[index]) as string;
  }
}

function hasPath(
  file: Record<string, unknown>,
  path: string | string[]
): boolean {
  let pathArray;
  if (typeof path === 'string') {
    pathArray = [path];
  } else {
    pathArray = path;
  }

  return _.some(pathArray, (p) => _.has(file, p));
}
