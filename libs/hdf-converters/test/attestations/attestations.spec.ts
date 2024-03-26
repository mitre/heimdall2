import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import moment from 'moment';
import {
  addAttestationToHDF,
  advanceDate,
  Attestation,
  createAttestationMessage,
  parseXLSXAttestations,
  convertAttestationToSegment
} from '../../src/utils/attestations';
import yaml from 'yaml';

const validPassingAttestation_skippedControl: Attestation[] = [
  {
    control_id: 'SV-230223',
    explanation: 'This control passes according to this attestation',
    frequency: '1d',
    status: 'passed',
    updated: '3000-01-01',
    updated_by: 'John Doe'
  }
];
const expiredPassingAttestation_skippedControl: Attestation[] = [
  {
    control_id: 'SV-230223',
    explanation: 'This control passes according to this attestation',
    frequency: '1d',
    status: 'passed',
    updated: '1999-01-01',
    updated_by: 'John Doe'
  }
];
const validFailingAttestation_skippedControl: Attestation[] = [
  {
    control_id: 'SV-230223',
    explanation: 'This control fails according to this attestation',
    frequency: '1d',
    status: 'failed',
    updated: '3000-01-01',
    updated_by: 'John Doe'
  }
];
const expiredFailingAttestation_skippedControl: Attestation[] = [
  {
    control_id: 'SV-230223',
    explanation: 'This control fails according to this attestation',
    frequency: '1d',
    status: 'failed',
    updated: '1999-01-01',
    updated_by: 'John Doe'
  }
];
const validPassingAttestation_passingControl: Attestation[] = [
  {
    control_id: 'SV-230221',
    explanation: 'This control passes according to this attestation',
    frequency: '1d',
    status: 'passed',
    updated: '3000-01-01',
    updated_by: 'John Doe'
  }
];
const expiredPassingAttestation_passingControl: Attestation[] = [
  {
    control_id: 'SV-230221',
    explanation: 'This control passes according to this attestation',
    frequency: '1d',
    status: 'passed',
    updated: '1999-01-01',
    updated_by: 'John Doe'
  }
];
const validPassingAttestation_failingControl: Attestation[] = [
  {
    control_id: 'SV-230222',
    explanation: 'This control passes according to this attestation',
    frequency: '1d',
    status: 'passed',
    updated: '3000-01-01',
    updated_by: 'John Doe'
  }
];
const expiredPassingAttestation_failingControl: Attestation[] = [
  {
    control_id: 'SV-230222',
    explanation: 'This control passes according to this attestation',
    frequency: '1d',
    status: 'passed',
    updated: '1999-01-01',
    updated_by: 'John Doe'
  }
];
const missing_attestation: Attestation[] = [
  {
    control_id: 'SV-111111',
    explanation: 'This control passes according to this attestation',
    frequency: '1d',
    status: 'passed',
    updated: '3000-01-01',
    updated_by: 'John Doe'
  }
];
const attestation_XLSXDate: Attestation[] = [
  {
    control_id: 'V-73166',
    explanation: 'This control passes according to this attestation',
    frequency: '153d',
    status: 'passed',
    updated: '2024-03-21T22:17:52.761Z',
    updated_by: 'John Doe'
  }
];
const attestations_yaml: Attestation[] = [
  {
    control_id: 'SV-230223',
    explanation: 'This control passes according to this attestation',
    frequency: '0d',
    status: 'passed',
    updated: '2024-03-26T15:20:05.181Z',
    updated_by: 'Attestation Tester'
  },
  {
    control_id: 'SV-230328',
    explanation: 'Control passes according to attestation',
    frequency: '1d',
    status: 'passed',
    updated: '2024-03-26T15:22:03.690Z',
    updated_by: 'Attestation Tester'
  }
];

describe('advanceDate', () => {
  it('Should return a date two weeks from now when given "fortnightly" as an input', () => {
    expect(
      advanceDate(moment.utc(1662758942000), 'fortnightly').toISOString(true)
    ).toEqual('2022-09-23T21:29:02.000+00:00');
  });

  it('Should return correct date when given custom number of days to advance by', () => {
    expect(
      advanceDate(moment.utc(1662758942000), '200d').toISOString(true)
    ).toEqual('2023-03-28T21:29:02.000+00:00');
  });

  it('Should return correct date when given custom number of weeks to advance by', () => {
    expect(
      advanceDate(moment.utc(1662758942000), '12w').toISOString(true)
    ).toEqual('2022-12-02T21:29:02.000+00:00');
  });

  it('Should return correct date when given custom number of months to advance by', () => {
    expect(
      advanceDate(moment.utc(1662758942000), '4m').toISOString(true)
    ).toEqual('2023-01-09T21:29:02.000+00:00');
  });

  it('Should return correct date when given custom number of years to advance by', () => {
    expect(
      advanceDate(moment.utc(1662758942000), '5y').toISOString(true)
    ).toEqual('2027-09-09T21:29:02.000+00:00');
  });
});

// Attestation messages are what is displayed in Heimdall for a given control test
// They are stored as a field in the attestation segment that is added
describe('CreateAttestationMessage', () => {
  it('Should create a message for a valid attestation', () => {
    const unexpiredAttestationMessage = createAttestationMessage(
      validPassingAttestation_skippedControl[0],
      false
    );

    expect(unexpiredAttestationMessage).toEqual(
      expect.stringMatching(/^Attestation/)
    );
  });

  it('Should create a message for an expired attestation', () => {
    const expiredAttestationMessage = createAttestationMessage(
      expiredPassingAttestation_skippedControl[0],
      true
    );

    expect(expiredAttestationMessage).toEqual(
      expect.stringMatching(/^Expired/)
    );
  });
});

describe('convertAttestationToSegment', () => {
  it('Should correctly convert a valid and passing attestation message to an HDF segment', () => {
    const segment_unexpired_pass = convertAttestationToSegment(
      validPassingAttestation_skippedControl[0]
    );
    expect(segment_unexpired_pass.status).toEqual('passed');
    expect(segment_unexpired_pass.message).toEqual(
      createAttestationMessage(validPassingAttestation_skippedControl[0], false)
    );
  });

  it('Should correctly convert an expired and passing attestation message to an HDF segment', () => {
    const segment_expired_pass = convertAttestationToSegment(
      expiredPassingAttestation_skippedControl[0]
    );
    expect(segment_expired_pass.status).toEqual(
      ExecJSON.ControlResultStatus.Skipped
    );
    expect(segment_expired_pass.message).toEqual(
      createAttestationMessage(
        expiredPassingAttestation_skippedControl[0],
        true
      )
    );
  });

  it('Should correctly convert a valid and failing attestation message to an HDF segment', () => {
    const segment_unexpired_fail = convertAttestationToSegment(
      validFailingAttestation_skippedControl[0]
    );
    expect(segment_unexpired_fail.status).toEqual('failed');
    expect(segment_unexpired_fail.message).toEqual(
      createAttestationMessage(validFailingAttestation_skippedControl[0], false)
    );
  });

  it('Should correctly convert an expired and failing attestation message to an HDF segment', () => {
    const segment_expired_fail = convertAttestationToSegment(
      expiredFailingAttestation_skippedControl[0]
    );
    expect(segment_expired_fail.status).toEqual(
      ExecJSON.ControlResultStatus.Skipped
    );
    expect(segment_expired_fail.message).toEqual(
      createAttestationMessage(
        expiredFailingAttestation_skippedControl[0],
        true
      )
    );
  });
});

describe('addAttestationToHDF', () => {
  let inputData: ExecJSON.Execution;
  const consoleOriginal = console.error;
  // Reset inputData and error console for each test
  beforeEach(() => {
    inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/attestations/rhel8_sample_oneOfEachControlStatus.json',
        'utf-8'
      )
    ) as ExecJSON.Execution;

    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = consoleOriginal;
  });

  /**
    * Adding an attestation creates an additional result object in the controls.results array within an HDF object
    * As additional attestations are applied, additional result objects are appended to the results array
    *   
            "results": [
              {
                "status": "passed",
                "code_desc": "The release \"8.9\" is still be within the support window ending on 31 May 2024",
                "run_time": 0.000225661,
                "start_time": "2024-03-18T17:10:44+00:00",
                "resource_class": "Object",
                "resource_params": "[]",
                "resource_id": "The release \"8.9\" is still be within the support window"
              },
              {
                "code_desc": "Manually verified status provided through attestation",
                "status": "passed",
                "message": "Attestation:\nStatus: passed\nExplanation: This is a test explanation for 230328\n\nUpdated: 3000-01-01\nUpdated By: Attestation Tester\nFrequency: monthly",
                "start_time": "2024-03-21T15:52:27.317Z"
              }
            ]
     * 
     * An additional attestation_data object is appended to the control segment itself within an HDF object
     * This attestation_data object is overwritten with the most recent attestation applied
     * 
            "attestation_data": {
              "control_id": "SV-230221",
              "explanation": "This is a test explanation for 230328",
              "frequency": "monthly",
              "status": "passed",
              "updated": "3000-01-01",
              "updated_by": "Attestation Tester"
            }
     * 
     */

  it('Should add a valid attestation to a skipped control', () => {
    const output = addAttestationToHDF(
      inputData,
      validPassingAttestation_skippedControl
    );

    // Check that the results array has one additional entry
    expect(output.profiles[0].controls[2].results.length).toEqual(2);
    // Check that the status of the new result is passing
    expect(output.profiles[0].controls[2].results[1].status).toEqual('passed');
    // Check that the attestation data added to the control is the attestation passed into the function
    expect(output.profiles[0].controls[2].attestation_data).toEqual(
      validPassingAttestation_skippedControl[0]
    );
  });

  it('Should add an expired attestation to a skipped control', () => {
    const output = addAttestationToHDF(
      inputData,
      expiredPassingAttestation_skippedControl
    );

    expect(output.profiles[0].controls[2].results.length).toEqual(2);
    // Check that the status of the new result is skipped
    expect(output.profiles[0].controls[2].results[1].status).toEqual(
      ExecJSON.ControlResultStatus.Skipped
    );
    expect(output.profiles[0].controls[2].attestation_data).toEqual(
      expiredPassingAttestation_skippedControl[0]
    );
  });

  it('Should not add an attestation to a passing control', () => {
    const output = addAttestationToHDF(
      inputData,
      validPassingAttestation_passingControl
    );

    // Check that the results array has no additional entries
    expect(output.profiles[0].controls[0].results.length).toEqual(1);
    // Check that there is no attestation_data added to the control
    expect(output.profiles[0].controls[0].attestation_data).toBeUndefined();
    // Check that the correct error console message was received
    expect(console.error).toHaveBeenCalledWith(
      'Invalid control selected: Control must have "skipped" status to be attested'
    );
  });

  it('Should not add an attestation to a failing control', () => {
    const output = addAttestationToHDF(
      inputData,
      validPassingAttestation_failingControl
    );
    // Failing control SV-230222 happens to have 2 entries already because it has 2 checks in the test
    expect(output.profiles[0].controls[1].results.length).toEqual(2);
    expect(output.profiles[0].controls[1].attestation_data).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      'Invalid control selected: Control must have "skipped" status to be attested'
    );
  });

  it('Should add and overwrite an attestation to a control that already has an expired attestation', () => {
    const output = addAttestationToHDF(
      addAttestationToHDF(inputData, expiredPassingAttestation_skippedControl),
      validPassingAttestation_skippedControl
    );
    // Check that the results array has two additional entries, this part doesn't overwrite
    expect(output.profiles[0].controls[2].results.length).toEqual(3);
    // Check that the status of the new result is passing
    expect(output.profiles[0].controls[2].results[2].status).toEqual('passed');
    // attestation_data is overwritten by most recently added attestation
    expect(output.profiles[0].controls[2].attestation_data).toEqual(
      validPassingAttestation_skippedControl[0]
    );
  });

  it('Should provide an error when an attestation cannot be found in the HDF file', () => {
    const output = addAttestationToHDF(inputData, missing_attestation);
    // Check that the results array has no additional entries
    expect(output.profiles[0].controls[0].results.length).toEqual(1);
    expect(output.profiles[0].controls[1].results.length).toEqual(2);
    expect(output.profiles[0].controls[2].results.length).toEqual(1);
    expect(output.profiles[0].controls[3].results.length).toEqual(1);
    // Check that there is no attestation_data added to the control
    expect(output.profiles[0].controls[0].attestation_data).toBeUndefined();
    expect(output.profiles[0].controls[1].attestation_data).toBeUndefined();
    expect(output.profiles[0].controls[2].attestation_data).toBeUndefined();
    expect(output.profiles[0].controls[3].attestation_data).toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      'Control SV-111111 not found in HDF. Skipping attestation.'
    );
  });
});

describe('parseXLSXAttestations', () => {
  const xlsxInputFile: Buffer = fs.readFileSync(
    'sample_jsons/attestations/attestations_xlsxInputFormat.xlsx',
    null
  );

  it('Should successfully parse XLSX attestations', async () => {
    const attestations = await parseXLSXAttestations(xlsxInputFile);

    expect(attestations[0]).toEqual(validPassingAttestation_skippedControl[0]);
    expect(attestations[1]).toEqual(
      expiredPassingAttestation_skippedControl[0]
    );
    expect(attestations[2]).toEqual(validFailingAttestation_skippedControl[0]);
    expect(attestations[3]).toEqual(
      expiredFailingAttestation_skippedControl[0]
    );
    expect(attestations[4]).toEqual(validPassingAttestation_passingControl[0]);
    expect(attestations[5]).toEqual(
      expiredPassingAttestation_passingControl[0]
    );
    expect(attestations[6]).toEqual(validPassingAttestation_failingControl[0]);
    expect(attestations[7]).toEqual(
      expiredPassingAttestation_failingControl[0]
    );
  });

  it('Should successfully parse XLSX attestations that use date objects instead of date strings', async () => {
    const attestations_date = await parseXLSXAttestations(xlsxInputFile);

    expect(attestations_date[8]).toEqual(attestation_XLSXDate[0]);
  });
});

describe('parseXLSXAttestations', () => {
  const yamlInputFile = fs.readFileSync(
    'sample_jsons/attestations/attestations_yamlFormat.yaml',
    'utf8'
  );

  const parsed_attestations_yaml: Attestation[] = [];

  it('Should successfully parse YAML attestations', () => {
    parsed_attestations_yaml.push(...yaml.parse(yamlInputFile));
    expect(parsed_attestations_yaml).toEqual(attestations_yaml);
  });
});
