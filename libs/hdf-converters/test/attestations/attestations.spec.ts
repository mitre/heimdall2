import fs from 'fs';
import moment from 'moment';
import {ExecJSON} from 'inspecjs';
import {
  addAttestationToHDF,
  parseXLSXAttestations,
  createAttestationMessage,
  advanceDate,
  Attestation
} from '../../src/utils/attestations';
import {omitHDFTimes, omitVersions} from '../utils';
import { String } from 'aws-sdk/clients/codebuild';

const attestationArray: Attestation[] = [
  {
    control_id: 'V-72087',
    explanation:
      'Audit logs are automatically backed up and cleared as necessary',
    frequency: 'monthly',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: moment().format("YYYY[-]MM[-]DD"),
    updated_by: 'Json Smith, Security'
  },
  {
    control_id: 'V-73163',
    explanation: 'Audit records are enabled for this system.',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '2022-01-02',
    updated_by: 'Alec Hardison, Security'
  }
]

describe('attestations', () => {

  it('Should create a message for attestations, including expiration status if expired', () => {
    // this attestation should NOT be expired
    const unexpiredAttestationMessage = createAttestationMessage(attestationArray[0], false)

    // this attestation should be expired
    const expiredAttestationMessage = createAttestationMessage(attestationArray[1], true)

    expect(unexpiredAttestationMessage).toEqual(expect.stringMatching(/^Attestation/))
    expect(expiredAttestationMessage).toEqual(expect.stringMatching(/^Expired/))

    // expect(unexpiredAttestationMessage.match(/Manually verified status provided through attestation/));
    // expect(unexpiredAttestationMessage.match(/Manually/)).not;
    // expect(expiredAttestationMessage.match(/Manual verification status provided through attestation has expired/));
  })

  it('Should successfully add an attestation to a results set and ignore expired ones', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/attestations/sample_input_report/rhel7-results.json',
        'utf-8'
      )
    ) as ExecJSON.Execution;

    const output = addAttestationToHDF(inputData, attestationArray);

    //fs.writeFileSync('sample_jsons/attestations/rhel7-json-attestedjson.json', JSON.stringify(output, null, 2))

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

    //fs.writeFileSync('sample_jsons/attestations/rhel7-json-spreadsheet.json', JSON.stringify(output, null, 2))

    expect(omitHDFTimes(omitVersions(output))).toEqual(
      omitHDFTimes(omitVersions(expected))
    );
  });

  it('Should parse words for durations correctly', () => {
    expect(advanceDate(moment(1662758942522), 'fortnightly').format()).toEqual('2022-09-23T17:29:02-04:00')
  });
});
