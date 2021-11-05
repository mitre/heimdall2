import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {ASFFMapper} from '../src/asff-mapper';
import {BurpSuiteMapper} from '../src/burpsuite-mapper';
import {IExecJSONASFF} from '../src/converters-from-hdf/asff-types';
import {FromHdfToAsffMapper} from '../src/converters-from-hdf/from-hdf-to-asff-mapper';
import {JfrogXrayMapper} from '../src/jfrog-xray-mapper';
import {NiktoMapper} from '../src/nikto-mapper';
import {SarifMapper} from '../src/sarif-mapper';
import {ScoutsuiteMapper} from '../src/scoutsuite-mapper';
import {XCCDFResultsMapper} from '../src/xccdf-results-mapper';
import {ZapMapper} from '../src/zap-mapper';

function omitVersions(input: ExecJSON.Execution): Partial<ExecJSON.Execution> {
  return _.omit(input, ['version', 'platform.release', 'profiles[0].sha256']);
}
test('Test converter toASFF function', () => {
  //One way to get a HDF example into the test. It converts the third party into HDF. The bottom function converts the HDF to ASFF
  const example =
    'sample_jsons/asff_mapper/sample_input_report/asff_sample.json'; //ASFFMapper
  const mapper = new ASFFMapper(fs.readFileSync(example, {encoding: 'utf-8'}));
  const hdfTemp: ExecJSON.Execution = mapper.toHdf();
  //Other way to test with a fie in HDF json format. It's read in and converted into ASFF
  /*
  //let example = 'red_hat_bad.json';//Already in HDF format
  //let example = 'aws-s3-baseline.json';
  let example = 'owasp_zap_webgoat.json';
  

  let hdfTemp = JSON.parse(fs.readFileSync(
    example, {
      encoding: 'utf-8'
    }
  ));*/

  //Options passed for the conversion to ASFF
  const opt = {
    input: 'owasp_zap_webgoat.json',
    output: '',
    awsAccountId: '12345678910',
    accessKeyId: '',
    accessKeySecret: '',
    target: 'redhat-reverse-proxy',
    region: 'us-east-2',
    upload: false
  };
  //The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
  const reverseMapper = new FromHdfToAsffMapper(hdfTemp, opt);
  const result: IExecJSONASFF | null = reverseMapper.toAsff();
  fs.writeFileSync('from_hdf_output.json', JSON.stringify(result));
  if (result !== undefined) {
    //Actual test has not been finished
    /*expect(omitVersions(result)).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/burpsuite_mapper/burpsuite-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );*/
  }
});

describe('asff_mapper', () => {
  it('Successfully converts Native ASFF', () => {
    const mapper = new ASFFMapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/asff_sample.json',
        {encoding: 'utf-8'}
      )
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/asff_mapper/asff-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
  it('Successfully converts Prowler ASFF as Array', () => {
    const mapper = new ASFFMapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/prowler_sample.json',
        {encoding: 'utf-8'}
      ),
      undefined,
      {name: 'Prowler', title: 'Prowler Findings'}
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/asff_mapper/prowler-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
  it('Successfully converts Prowler ASFF as Objects delimited by newline', () => {
    const mapper = new ASFFMapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/prower-sample.asff-json',
        {encoding: 'utf-8'}
      ),
      undefined,
      {name: 'Prowler', title: 'Prowler Findings'}
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/asff_mapper/prowler-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

test('Test burpsuite_mapper', () => {
  const mapper = new BurpSuiteMapper(
    fs.readFileSync(
      'sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min',
      {encoding: 'utf-8'}
    )
  );
  expect(omitVersions(mapper.toHdf())).toEqual(
    omitVersions(
      JSON.parse(
        fs.readFileSync('sample_jsons/burpsuite_mapper/burpsuite-hdf.json', {
          encoding: 'utf-8'
        })
      )
    )
  );
});

test('Test jfrog_xray_mapper', () => {
  const mapper = new JfrogXrayMapper(
    fs.readFileSync(
      'sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json',
      {encoding: 'utf-8'}
    )
  );
  expect(omitVersions(mapper.toHdf())).toEqual(
    omitVersions(
      JSON.parse(
        fs.readFileSync('sample_jsons/jfrog_xray_mapper/jfrog-hdf.json', {
          encoding: 'utf-8'
        })
      )
    )
  );
});
test('Test nikto_mapper', () => {
  const mapper = new NiktoMapper(
    fs.readFileSync(
      'sample_jsons/nikto_mapper/sample_input_report/zero.webappsecurity.json',
      {encoding: 'utf-8'}
    )
  );
  expect(omitVersions(mapper.toHdf())).toEqual(
    omitVersions(
      JSON.parse(
        fs.readFileSync('sample_jsons/nikto_mapper/nikto-hdf.json', {
          encoding: 'utf-8'
        })
      )
    )
  );
});
test('Test sarif_mapper', () => {
  const mapper = new SarifMapper(
    fs.readFileSync(
      'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif',
      {encoding: 'utf-8'}
    )
  );
  expect(omitVersions(mapper.toHdf())).toEqual(
    omitVersions(
      JSON.parse(
        fs.readFileSync('sample_jsons/sarif_mapper/sarif-hdf.json', {
          encoding: 'utf-8'
        })
      )
    )
  );
});
test('Test scoutsuite_mapper', () => {
  const mapper = new ScoutsuiteMapper(
    fs.readFileSync(
      'sample_jsons/scoutsuite_mapper/sample_input_report/scoutsuite_sample.js',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();

  expect(omitVersions(result)).toEqual(
    omitVersions(
      JSON.parse(
        fs.readFileSync('sample_jsons/scoutsuite_mapper/scoutsuite-hdf.json', {
          encoding: 'utf-8'
        })
      )
    )
  );
});
test('Test xccdf_results_mapper', () => {
  const mapper = new XCCDFResultsMapper(
    fs.readFileSync(
      'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results.xml',
      {encoding: 'utf-8'}
    )
  );
  expect(omitVersions(mapper.toHdf())).toEqual(
    omitVersions(
      JSON.parse(
        fs.readFileSync('sample_jsons/xccdf_results_mapper/xccdf-hdf.json', {
          encoding: 'utf-8'
        })
      )
    )
  );
});
test('Test zap_mapper webgoat.json', () => {
  const mapper = new ZapMapper(
    fs.readFileSync(
      'sample_jsons/zap_mapper/sample_input_report/webgoat.json',
      {encoding: 'utf-8'}
    ),
    'http://mymac.com:8191'
  );
  expect(omitVersions(mapper.toHdf())).toEqual(
    omitVersions(
      JSON.parse(
        fs.readFileSync('sample_jsons/zap_mapper/zap-webgoat-hdf.json', {
          encoding: 'utf-8'
        })
      )
    )
  );
});
test('Test zap_mapper zero.webappsecurity.json', () => {
  const mapper = new ZapMapper(
    fs.readFileSync(
      'sample_jsons/zap_mapper/sample_input_report/zero.webappsecurity.json',
      {encoding: 'utf-8'}
    ),
    'http://zero.webappsecurity.com'
  );
  expect(omitVersions(mapper.toHdf())).toEqual(
    omitVersions(
      JSON.parse(
        fs.readFileSync('sample_jsons/zap_mapper/zap-webappsecurity-hdf.json', {
          encoding: 'utf-8'
        })
      )
    )
  );
});
