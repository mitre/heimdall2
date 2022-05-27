import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {
  addAttestationToHDF,
  AdvanceDateFrequency,
  parseXLSXAttestations
} from '../../src/utils/attestations';
import {omitHDFTimes, omitVersions} from '../utils';

describe('attestations', () => {
  it('Should successfully add an attestation to a results set and ignore expired ones', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/attestations/sample_input_report/rhel7-results.json',
        'utf-8'
      )
    ) as ExecJSON.Execution;

    const output = addAttestationToHDF(inputData, [
      {
        control_id: 'V-72087',
        explanation:
          'Audit logs are automatically backed up and cleared as necessary',
        frequency: AdvanceDateFrequency.monthly,
        status: ExecJSON.ControlResultStatus.Passed,
        updated: '2022-05-02',
        updated_by: 'Json Smith, Security'
      },
      {
        control_id: 'V-73163',
        explanation: 'Audit records are enabled for this system.',
        frequency: AdvanceDateFrequency.daily,
        status: ExecJSON.ControlResultStatus.Passed,
        updated: '2022-01-02',
        updated_by: 'Alec Hardison, Security'
      }
    ]);

    fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
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

    expect(omitHDFTimes(omitVersions(output))).toEqual(
      omitHDFTimes(omitVersions(expected))
    );
  });
});
