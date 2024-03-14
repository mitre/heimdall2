import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import moment from 'moment';
import {
  addAttestationToHDF,
  advanceDate,
  Attestation,
  createAttestationMessage,
  parseXLSXAttestations
} from '../../src/utils/attestations';
import {omitHDFTimes, omitVersions} from '../utils';

const attestationArray: Attestation[] = [
  {
    control_id: 'V-72087',
    explanation:
      'Audit logs are automatically backed up and cleared as necessary',
    frequency: 'monthly',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: moment().format('YYYY[-]MM[-]DD'),
    updated_by: 'Json Smith, Security'
  },
  {
    control_id: 'V-73163',
    explanation: 'Audit records are enabled for this system.',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '2022-01-02',
    updated_by: 'Alec Hardison, Security'
  },
  {
    control_id: 'V-72083',
    explanation:
      'The operating system off-loads audit records onto a different system from the system being audited.',
    frequency: '7w',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: moment().format('YYYY[-]MM[-]DD'),
    updated_by: 'Bobby Smalls, Security'
  },
  {
    control_id: 'V-72085',
    explanation: 'The operating system the transfer of audit records.',
    frequency: '3m',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: moment().format('YYYY[-]MM[-]DD'),
    updated_by: 'Billy Weiss, Security'
  },
  {
    control_id: 'V-72219',
    explanation: 'The operating system the transfer of audit records.',
    frequency: '2y',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: moment().format('YYYY[-]MM[-]DD'),
    updated_by: 'John Doe, Security'
  }
];

describe('attestations', () => {
  it('Should create a message for attestations, including expiration status if expired', () => {
    // this attestation should NOT be expired
    const unexpiredAttestationMessage = createAttestationMessage(
      attestationArray[0],
      false
    );

    // this attestation should be expired
    const expiredAttestationMessage = createAttestationMessage(
      attestationArray[1],
      true
    );

    expect(unexpiredAttestationMessage).toEqual(
      expect.stringMatching(/^Attestation/)
    );
    expect(expiredAttestationMessage).toEqual(
      expect.stringMatching(/^Expired/)
    );
  });

  it('Should successfully add an attestation to a results set and ignore expired ones', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/attestations/sample_input_report/rhel7-results.json',
        'utf-8'
      )
    ) as ExecJSON.Execution;

    const output = addAttestationToHDF(inputData, attestationArray);

    fs.writeFileSync('sample_jsons/attestations/rhel7-json-attestedjson.json', JSON.stringify(output, null, 2))

    const expected = JSON.parse(
      fs.readFileSync(
        'sample_jsons/attestations/rhel7-json-attestedjson.json',
        'utf-8'
      )
    );

    expect(omitHDFTimes(omitVersions(output))).toEqual(
      omitHDFTimes(omitVersions(expected))
    );
  });

  it('Should successfully parse XLSX attestations', async () => {
    const xlsxInputFile: Buffer = fs.readFileSync(
      'sample_jsons/attestations/attestations.xlsx',
      null
    );
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/attestations/sample_input_report/rhel7-results.json',
        'utf-8'
      )
    ) as ExecJSON.Execution;

    const attestations = await parseXLSXAttestations(xlsxInputFile);
    const output = addAttestationToHDF(inputData, attestations);

    const expected = JSON.parse(
      fs.readFileSync(
        'sample_jsons/attestations/rhel7-json-spreadsheet.json',
        'utf-8'
      )
    );

    fs.writeFileSync('sample_jsons/attestations/rhel7-json-spreadsheet.json', JSON.stringify(output, null, 2))

    expect(omitHDFTimes(omitVersions(output))).toEqual(
      omitHDFTimes(omitVersions(expected))
    );
  });

  it('Should parse words for durations correctly', () => {
    expect(
      advanceDate(moment.utc(1662758942000), 'fortnightly').toISOString(true)
    ).toEqual('2022-09-23T21:29:02.000+00:00');
  });

  it('Should parse input for custom number of days correctly', () => {
    expect(
      advanceDate(moment.utc(1662758942000), '200d').toISOString(true)
    ).toEqual('2023-03-28T21:29:02.000+00:00');
  });

  it('Should parse input for custom number of weeks correctly', () => {
    expect(
      advanceDate(moment.utc(1662758942000), '12w').toISOString(true)
    ).toEqual('2022-12-02T21:29:02.000+00:00');
  });

  it('Should parse input for custom number of months correctly', () => {
    expect(
      advanceDate(moment.utc(1662758942000), '4m').toISOString(true)
    ).toEqual('2023-01-09T21:29:02.000+00:00');
  });

  it('Should parse input for custom number of years correctly', () => {
    expect(
      advanceDate(moment.utc(1662758942000), '5y').toISOString(true)
    ).toEqual('2027-09-09T21:29:02.000+00:00');
  });

});
