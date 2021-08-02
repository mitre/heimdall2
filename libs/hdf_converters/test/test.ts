import fs from 'fs';
import {ExecJSON} from '../../inspecjs/src/inspecjs';
import {BurpSuiteMapper} from '../src/burpsuite-mapper';
import {JfrogXrayMapper} from '../src/jfrog-xray-mapper';
import {NiktoMapper} from '../src/nikto-mapper';
import {SarifMapper} from '../src/sarif-mapper';
import {ScoutsuiteMapper} from '../src/scoutsuite-mapper';
import {XCCDFResultsMapper} from '../src/xccdf-results-mapper';
import {ZapMapper} from '../src/zap-mapper';

test('Returns proper Hdf output from Burpsuite', () => {
  const mapper = new BurpSuiteMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  fs.writeFileSync(
    'libs/hdf_converters/outputs/burpsuite.json',
    JSON.stringify(mapper.toHdf())
  );
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/zero.webappsecurity.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});

test('Returns proper Hdf output from JFrog', () => {
  const mapper = new JfrogXrayMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/jfrog_xray_hdf.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Nikto', () => {
  const mapper = new NiktoMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nikto_mapper/sample_input_jsons/zero.webappsecurity.json',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nikto_mapper/zero.webappsecurity.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Sarif', () => {
  const mapper = new SarifMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/sarif_mapper/sample_input_jsons/sarif_input.sarif',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/sarif_mapper/sarif_output.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Scoutsuite', () => {
  const mapper = new ScoutsuiteMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/scoutsuite_mapper/sample_input_jsons/scoutsuite_sample.js',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/scoutsuite_mapper/scoutsuite_hdf.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Xccdf Results', () => {
  const mapper = new XCCDFResultsMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results.xml',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/xccdf_results_mapper/xccdf-hdf.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Zap', () => {
  const mapper = new ZapMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/zap_mapper/sample_input_jsons/zero.webappsecurity.json',
      {encoding: 'utf-8'}
    ),
    'http://mymac.com:8191'
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/zap_mapper/zero.webappsecurity.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});

// AWS-Config Test
// const credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
// const options: ConfigServiceClientConfig = {
//   region: 'us-east-1',
//   credentials: credentials
// };
// const awsmapper = new AwsConfigMapper(options);
// awsmapper.toHdf();

// DBProtect Test - Complete!
// const mapper2 = new DBProtectMapper(
//   fs.readFileSync(
//     '/Users/rlin/Desktop/Samples/DbProtectCheckResultsDetailsXML.xml',
//     {encoding: 'utf-8'}
//   )
// );
// //fs.writeFileSync('libs/hdf_converters/converted_jsons/dbprotectJson.json', JSON.stringify(mapper.data))
// fs.writeFileSync(
//   'libs/hdf_converters/outputs/dbprotect.json',
//   JSON.stringify(mapper2.toHdf())
// );

// // FortifyMapper Test - Complete!
// const mapper3 = new FortifyMapper(
//   fs.readFileSync('/Users/rlin/Desktop/Samples/fortify_webgoat_results.fvdl', {
//     encoding: 'utf-8'
//   })
// );
// //fs.writeFileSync('libs/hdf_converters/converted_jsons/fortifyJson.json', JSON.stringify(mapper.data))
// fs.writeFileSync(
//   'libs/hdf_converters/outputs/fortify.json',
//   JSON.stringify(mapper3.toHdf())
// );

// JFrog Test - Complete!
// const mapper4 = new JfrogXrayMapper(
//   fs.readFileSync(
//     '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json',
//     {encoding: 'utf-8'}
//   )
// );
// fs.writeFileSync(
//   'libs/hdf_converters/outputs/jfrog.json',
//   JSON.stringify(mapper4.toHdf())
// );

// Nessus Test
// const mapper5 = new NessusResults(
//   fs.readFileSync(
//     '/Users/rlin/Desktop/Samples/sensitive_nessus_samples_using_v1.3.48/sensitive_273970_compliance.nessus',
//     {encoding: 'utf-8'}
//   )
// );
// fs.writeFileSync('libs/hdf_converters/converted_jsons/nessuscomplianceJson.json', JSON.stringify(mapper5.data))
// const result = mapper5.toHdf();
// if (Array.isArray(result)) {
//   result.forEach((element) => {
//     fs.writeFileSync(
//       `libs/hdf_converters/outputs/nessuscompliance-${_.get(
//         element,
//         'platform.target_id'
//       )}.json`,
//       JSON.stringify(element)
//     );
//   });
// } else {
//   fs.writeFileSync(
//     'libs/hdf_converters/outputs/nessus.json',
//     JSON.stringify(result)
//   );
// }

// XCCDF Test - Complete!
// var mapper = new XCCDFResultsMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results.xml', {encoding: 'utf-8'}));
// fs.writeFileSync('libs/hdf_converters/converted_jsons/xccdfJson.json', JSON.stringify(mapper.data));
// fs.writeFileSync('libs/hdf_converters/outputs/xccdf.json', JSON.stringify(mapper.toHdf()));

// ZapMapper Test - Complete!
// var mapper = new ZapMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/zap_mapper/sample_input_jsons/webgoat.json', { encoding: 'utf-8' }), 'http://mymac.com:8191')
// fs.writeFileSync('libs/hdf_converters/outputs/zapmapper.json', JSON.stringify(mapper.toHdf()))
