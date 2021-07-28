import {ConfigServiceClientConfig} from '@aws-sdk/client-config-service';
import * as AWS from 'aws-sdk';
import {AwsConfigMapper} from './aws-config-mapper';

// AWS-Config Test
const credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
const options: ConfigServiceClientConfig = {
  region: 'us-east-1',
  credentials: credentials
};
const awsmapper = new AwsConfigMapper(options);
awsmapper.toHdf();

// Burpsuite Test - Complete!
// const mapper = new BurpSuiteMapper(
//   fs.readFileSync(
//     '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min',
//     {encoding: 'utf-8'}
//   )
// );
// fs.writeFileSync(
//   'libs/hdf_converters/converted_jsons/burpsJson.json',
//   JSON.stringify(mapper.data)
// );
// fs.writeFileSync(
//   'libs/hdf_converters/outputs/burpsuite.json',
//   JSON.stringify(mapper.toHdf())
// );

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
