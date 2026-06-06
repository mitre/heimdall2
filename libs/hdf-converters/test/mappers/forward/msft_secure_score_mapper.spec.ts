import {describe, expect, it} from 'vitest';
import {
  MsftSecureScoreResults,
  CombinedResponse
} from '../../../src/msft-secure-score-mapper';
import {omitVersions, readSample} from '../../utils';

describe('msft_secure_score_mapper', () => {
  it('Successfully converts Microsoft Secure Score reports', () => {
    const mapper = new MsftSecureScoreResults(
      readSample('msft_secure_score_mapper/sample_input_report/combined.json')
    );

    // fs.writeFileSync(
    //   'sample_jsons/msft_secure_score_mapper/secure_score-hdfs.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expectedHdfReports = JSON.parse(
      readSample('msft_secure_score_mapper/secure_score-hdfs.json')
    );

    for (const [idx, hdfReport] of mapper.toHdf().entries()) {
      expect(omitVersions(hdfReport)).toEqual(
        omitVersions(expectedHdfReports[idx])
      );
    }
  });
});

describe('msft_secure_score_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Microsoft Secure Score reports', () => {
    const mapper = new MsftSecureScoreResults(
      readSample('msft_secure_score_mapper/sample_input_report/combined.json'),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/msft_secure_score_mapper/secure_score-hdf-withraws.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expectedHdfReports = JSON.parse(
      readSample('msft_secure_score_mapper/secure_score-hdf-withraws.json')
    );

    for (const [idx, hdfReport] of mapper.toHdf().entries()) {
      expect(omitVersions(hdfReport)).toEqual(
        omitVersions(expectedHdfReports[idx])
      );
    }
  });
});

describe('msft_secure_score_mapper_multiple_reports', () => {
  it('Successfully converts multiple Microsoft Secure Score reports into multiple ohdf files', () => {
    const input_data: CombinedResponse = {
      profiles: JSON.parse(
        readSample('msft_secure_score_mapper/sample_input_report/profiles.json')
      ),
      secureScore: JSON.parse(
        readSample('msft_secure_score_mapper/sample_input_report/secureScore-multiple.json')
      )
    };

    const mapper = new MsftSecureScoreResults(JSON.stringify(input_data));

    // fs.writeFileSync(
    //   'sample_jsons/msft_secure_score_mapper/secure_score-hdf-multi.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expectedHdfReports = JSON.parse(
      readSample('msft_secure_score_mapper/secure_score-hdf-multi.json')
    );

    for (const [idx, hdfReport] of mapper.toHdf().entries()) {
      expect(omitVersions(hdfReport)).toEqual(
        omitVersions(expectedHdfReports[idx])
      );
    }
  });
});
