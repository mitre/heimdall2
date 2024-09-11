import fs from 'fs';
import {
  MsftSecureScoreResults,
  CombinedResponse
} from '../../../src/msft-secure-score-mapper';
import {omitVersions} from '../../utils';

describe('msft_secure_score_mapper', () => {
  it('Successfully converts Microsoft Secure Score reports', () => {
    const mapper = new MsftSecureScoreResults(
      fs.readFileSync(
        'sample_jsons/msft_secure_score_mapper/sample_input_report/combined.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/msft_secure_score_mapper/secure_score-hdfs.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expectedHdfReports = JSON.parse(
      fs.readFileSync(
        'sample_jsons/msft_secure_score_mapper/secure_score-hdfs.json',
        {encoding: 'utf-8'}
      )
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
      fs.readFileSync(
        'sample_jsons/msft_secure_score_mapper/sample_input_report/combined.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/msft_secure_score_mapper/secure_score-hdf-withraws.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expectedHdfReports = JSON.parse(
      fs.readFileSync(
        'sample_jsons/msft_secure_score_mapper/secure_score-hdf-withraws.json',
        {encoding: 'utf-8'}
      )
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
        fs.readFileSync(
          'sample_jsons/msft_secure_score_mapper/sample_input_report/profiles.json',
          {encoding: 'utf-8'}
        )
      ),
      secureScore: JSON.parse(
        fs.readFileSync(
          'sample_jsons/msft_secure_score_mapper/sample_input_report/secureScore-multiple.json',
          {encoding: 'utf-8'}
        )
      )
    };

    const mapper = new MsftSecureScoreResults(JSON.stringify(input_data));

    // fs.writeFileSync(
    //   'sample_jsons/msft_secure_score_mapper/secure_score-hdf-multi.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expectedHdfReports = JSON.parse(
      fs.readFileSync(
        'sample_jsons/msft_secure_score_mapper/secure_score-hdf-multi.json',
        {encoding: 'utf-8'}
      )
    );

    for (const [idx, hdfReport] of mapper.toHdf().entries()) {
      expect(omitVersions(hdfReport)).toEqual(
        omitVersions(expectedHdfReports[idx])
      );
    }
  });
});
