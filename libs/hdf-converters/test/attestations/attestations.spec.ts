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
import {omitHDFTimes, omitVersions} from '../utils';
import _ from 'lodash';
// test a new attestation array for each frequency, use arbitrary far date (yr 3000, 1900)
// try applying to attestations w diff statuses
const attestationMessageArray: Attestation[] = [
  {
    control_id: 'V-72087',
    explanation: 'This is a passing attestation that is not expired',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '3000-01-01',
    updated_by: 'John Doe'
  },
  {
    control_id: 'V-73163',
    explanation: 'This is a passing attestation that is expired',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '1999-01-01',
    updated_by: 'Jane Doe'
  },
  {
    control_id: 'V-73164',
    explanation: 'This is a failing attestation that is not expired',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Failed,
    updated: '3000-01-01',
    updated_by: 'John Doe'
  },
  {
    control_id: 'V-73165',
    explanation: 'This is a failing attestation that is expired',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Failed,
    updated: '1999-01-01',
    updated_by: 'Jane Doe'
  }
];

const aPass_cSkip_unexp: Attestation[] = [
  {
    control_id: 'SV-230223',
    explanation:
      'This is a test unexpired passing attestation for a skipped control',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '3000-01-01',
    updated_by: 'Attestation Tester'
  }
];
const aPass_cSkip_exp: Attestation[] = [
  {
    control_id: 'SV-230223',
    explanation:
      'This is a test expired passing attestation for a skipped control',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '1999-01-01',
    updated_by: 'Attestation Tester'
  }
];

// Naming convention: a<Pass/Fail>_<c<Pass/Fail/Skip>>_<unexp/exp>, so attestation<status>_control<status>_<unexpired/expired>
const aPass_cPass_unexp: Attestation[] = [
  {
    control_id: 'SV-230221',
    explanation: 'This is a test explanation for 230328',
    frequency: 'monthly',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '3000-01-01',
    updated_by: 'Attestation Tester'
  }
];

const aPass_cPass_exp: Attestation[] = [
  {
    control_id: 'SV-230221',
    explanation: 'This is a test explanation for 230328',
    frequency: 'monthly',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '1999-01-01',
    updated_by: 'Attestation Tester'
  }
];

const aFail_cPass_unexp: Attestation[] = [
  {
    control_id: 'SV-230221',
    explanation: 'This is a test explanation for 230328',
    frequency: 'monthly',
    status: ExecJSON.ControlResultStatus.Failed,
    updated: '3000-01-01',
    updated_by: 'Attestation Tester'
  }
];

const aFail_cPass_exp: Attestation[] = [
  {
    control_id: 'SV-230221',
    explanation: 'This is a test explanation for 230328',
    frequency: 'monthly',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '1999-01-01',
    updated_by: 'Attestation Tester'
  }
];

const aPass_cFail_unexp: Attestation[] = [
  {
    control_id: 'SV-230222',
    explanation: 'This is a test explanation for 230222',
    frequency: '1d',
    status: ExecJSON.ControlResultStatus.Passed,
    updated: '3000-01-01',
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

describe('CreateAttestationMessage', () => {
  it('Should create a message for an unexpired attestation', () => {
    // this attestation should NOT be expired
    const unexpiredAttestationMessage = createAttestationMessage(
      attestationMessageArray[0],
      false
    );

    expect(unexpiredAttestationMessage).toEqual(
      expect.stringMatching(/^Attestation/)
    );
  });

  it('Should create a message for an expired attestation', () => {
    // this attestation should be expired
    const expiredAttestationMessage = createAttestationMessage(
      attestationMessageArray[1],
      true
    );

    expect(expiredAttestationMessage).toEqual(
      expect.stringMatching(/^Expired/)
    );
  });
});

describe('convertAttestationToSegment', () => {
  it('Should convert a passing and unexpired attestation message to an HDF file segment', () => {
    const segment_unexpired_pass = convertAttestationToSegment(
      attestationMessageArray[0]
    );
    expect(segment_unexpired_pass.status).toEqual(
      ExecJSON.ControlResultStatus.Passed
    );
    expect(segment_unexpired_pass.message).toEqual(
      createAttestationMessage(attestationMessageArray[0], false)
    );
  });

  it('Should convert a passing and expired attestation message to an HDF file segment', () => {
    const segment_expired_pass = convertAttestationToSegment(
      attestationMessageArray[1]
    );
    expect(segment_expired_pass.status).toEqual(
      ExecJSON.ControlResultStatus.Skipped
    );
    expect(segment_expired_pass.message).toEqual(
      createAttestationMessage(attestationMessageArray[1], true)
    );
  });

  it('Should convert a failing and unexpired attestation message to an HDF file segment', () => {
    const segment_unexpired_fail = convertAttestationToSegment(
      attestationMessageArray[2]
    );
    expect(segment_unexpired_fail.status).toEqual(
      ExecJSON.ControlResultStatus.Failed
    );
    expect(segment_unexpired_fail.message).toEqual(
      createAttestationMessage(attestationMessageArray[2], false)
    );
  });

  it('Should convert a failing and expired attestation message to an HDF file segment', () => {
    const segment_expired_fail = convertAttestationToSegment(
      attestationMessageArray[3]
    );
    expect(segment_expired_fail.status).toEqual(
      ExecJSON.ControlResultStatus.Skipped
    );
    expect(segment_expired_fail.message).toEqual(
      createAttestationMessage(attestationMessageArray[3], true)
    );
  });
});

describe('addAttestationToHDF', () => {
  let inputData: ExecJSON.Execution;
  const consoleOriginal = console.error;
  // Reset inputData for each test
  beforeEach(() => {
    inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/attestations/sample_input_report/rhel8_sample_more.json',
        'utf-8'
      )
    ) as ExecJSON.Execution;

    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = consoleOriginal;
  });

  /**
     * Adding an attestation results in HDF object having an additional result object in controls.results array
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
     * and an additional "attestation_data" object in control object itself appended to the end
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

  it('Should add an unexpired attestation to a skipped control', () => {
    const output = addAttestationToHDF(inputData, aPass_cSkip_unexp);

    // Check that the results array has one additional entry
    expect(output.profiles[0].controls[2].results.length).toEqual(2);
    // Check that the status of the new result is passing
    expect(output.profiles[0].controls[2].results[1].status).toEqual(
      ExecJSON.ControlResultStatus.Passed
    );
    // Check that the attestation data added to the control is the equal to the attestation passed into the function
    expect(output.profiles[0].controls[2].attestation_data).toEqual(
      aPass_cSkip_unexp[0]
    );
  });

  it('Should add an expired attestation to a skipped control', () => {
    const output = addAttestationToHDF(inputData, aPass_cSkip_exp);

    // Check that the results array has one additional entry
    expect(output.profiles[0].controls[2].results.length).toEqual(2);
    // Check that the status of the new result is skipped
    expect(output.profiles[0].controls[2].results[1].status).toEqual(
      ExecJSON.ControlResultStatus.Skipped
    );
    // Check that the attestation data added to the control is the equal to the attestation passed into the function
    expect(output.profiles[0].controls[2].attestation_data).toEqual(
      aPass_cSkip_exp[0]
    );
  });

  it('Should not add an attestation to a passing control', () => {
    const output = addAttestationToHDF(inputData, aPass_cPass_unexp);

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
    const output = addAttestationToHDF(inputData, aPass_cFail_unexp);
    // Check that the results array has no additional entries
    // Failing control SV-230222 happens to have 2 entries already because it has 2 checks in the test
    expect(output.profiles[0].controls[1].results.length).toEqual(2);
    // Check that there is no attestation_data added to the control
    expect(output.profiles[0].controls[1].attestation_data).toBeUndefined();
    // Check that the correct error console message was received
    expect(console.error).toHaveBeenCalledWith(
      'Invalid control selected: Control must have "skipped" status to be attested'
    );
  });

  it('Should add and overwrite an attestation to a control that has already an expired attestation', () => {
    // Add unexpired attestation to skipped control that already has an expired attestation added
    const output = addAttestationToHDF(
      addAttestationToHDF(inputData, aPass_cSkip_exp),
      aPass_cSkip_unexp
    );
    // Check that the results array has two additional entries, this part doesn't overwrite
    expect(output.profiles[0].controls[2].results.length).toEqual(3);
    // Check that the status of the new result is passing
    expect(output.profiles[0].controls[2].results[2].status).toEqual(
      ExecJSON.ControlResultStatus.Passed
    );
    // attestation_data is overwritten by most recently added attestation
    expect(output.profiles[0].controls[2].attestation_data).toEqual(
      aPass_cSkip_unexp[0]
    );
  });
});

describe('parseXLSXAttestations', () => {
  // To test this, have it parse attestations that are identical to ones made here up above, check for equality
  it('Should successfully parse XLSX attestations', async () => {
    const xlsxInputFile: Buffer = fs.readFileSync(
      'sample_jsons/attestations/attestations-2.xlsx',
      null
    );
    const attestations = await parseXLSXAttestations(xlsxInputFile);
    expect(attestations).toEqual(attestationMessageArray);
  });
});
