import {ExecJSON} from 'inspecjs';
import {ControlResultStatus} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import moment from 'moment';
import ms from 'ms';
import XLSX from 'xlsx';

export type Attestation = {
  control_id: string;
  explanation: string;
  frequency: string;
  status: ControlResultStatus;
  updated: string;
  updated_by: string;
};

function advanceDate(date: moment.Moment, frequency: string): moment.Moment {
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
    case 'weekly':
      date.add(1, 'week');
      break;
    case 'daily':
      date.add(1, 'day');
      break;
    default:
      date.add(ms(frequency), 'milliseconds');
      break;
  }

  return date;
}

function createAttestationMessage(attestation: Attestation, expired: boolean) {
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

  message += `Update: ${attestation.updated}\n`;
  message += `Updated By: ${attestation.updated_by}\n`;
  message += `Frequency: ${attestation.frequency}`;

  return message;
}

export function convertAttestationToSegment(
  attestation: Attestation
): ExecJSON.ControlResult {
  const updateDate = moment(attestation.updated);
  const expiresAt = advanceDate(updateDate, attestation.frequency);

  if (expiresAt.isBefore(new Date())) {
    console.log(
      `Warning: Attestation Expired: ${
        attestation.control_id
      } (Expired at ${expiresAt.toString()})`
    );
    return {
      code_desc: 'Manual verification status via attestation has expired',
      status: ExecJSON.ControlResultStatus.Skipped,
      run_time: 0.0,
      message: createAttestationMessage(attestation, true),
      start_time: new Date().toISOString()
    };
  } else {
    return {
      code_desc: 'Manually verified Status provided through attestation',
      status: attestation.status,
      run_time: 0.0,
      message: createAttestationMessage(attestation, true),
      start_time: new Date().toISOString()
    };
  }
}

export function addAttestationToHDF(
  hdf: ExecJSON.Execution,
  attestations: Attestation[]
): ExecJSON.Execution {
  hdf.profiles = hdf.profiles.map((profile) => {
    profile.controls = profile.controls.map((control) => {
      attestations.forEach((attestation) => {
        if (attestation.control_id.toLowerCase() === control.id.toLowerCase()) {
          control.results.push(convertAttestationToSegment(attestation));
        }
      });
      return control;
    });
    return profile;
  });

  return hdf;
}

export async function parseXLSXAttestations(
  attestationXLSX: Uint8Array
): Promise<Attestation[]> {
  return new Promise((resolve, reject) => {
    const workbook = XLSX.read(attestationXLSX, {
      cellDates: true
    });
    const sheet = workbook.Sheets['attestations'];
    const data: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
    const attestations: Attestation[] = data.map((attestation) => {
      return {
        control_id: getFirstPath(attestation, [
          'Control_ID',
          'control_id',
          'id',
          'control'
        ]),
        explanation: getFirstPath(attestation, [
          'Explanation',
          'explanation',
          'explain'
        ]),
        frequency: getFirstPath(attestation, ['Frequency', 'frequency']),
        status: getFirstPath(attestation, ['Status', 'status']),
        updated: getFirstPath(attestation, [
          'Updated',
          'updated',
          'Updated At',
          'updated at',
          'Updated_At',
          'updated_at'
        ]),
        updated_by: getFirstPath(attestation, [
          'Updated_By',
          'updated_by',
          'Updated By',
          'Updated by'
        ])
      } as Attestation;
    });
    resolve(attestations);
  });
}

function getFirstPath(object: Record<string, unknown>, paths: string[]) {
  const index = _.findIndex(paths, (p) => hasPath(object, p));

  if (index === -1) {
    throw new Error(`Attestation missing one of paths: ${paths.join(', ')}`);
  } else {
    return _.get(object, paths[index]) || '';
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
