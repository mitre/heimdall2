import fs from 'fs';
import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import _ from 'lodash';
import { BurpSuiteMapper } from './burpsuite-mapper';
import { DBProtectMapper } from './dbprotect-mapper';
import { FortifyMapper } from './fortify-mapper';
import { JfrogXrayMapper } from './jfrog-xray-mapper';
import { NessusResults } from './nessus-mapper';
import { NetsparkerMapper } from './netsparker-mapper';
import { NiktoMapper } from './nikto-mapper';
import { SarifMapper } from './sarif-mapper';
import { ScoutsuiteMapper } from './scoutsuite-mapper';
import { SnykResults } from './snyk-mapper';
import { XCCDFResultsMapper } from './xccdf-results-mapper';
import { ZapMapper } from './zap-mapper';


// Burpsuite Test - Complete!
// var mapper = new BurpSuiteMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min', { encoding: 'utf-8' }));
// fs.writeFileSync('libs/heimdall_tools/converted_jsons/burpsJson.json', JSON.stringify(mapper.data));
// fs.writeFileSync('libs/heimdall_tools/outputs/burpsuite.json', JSON.stringify(mapper.toHdf()));

// JFrog Test - Complete!
// var mapper = new JfrogXrayMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/jfrog.json', JSON.stringify(mapper.toHdf()))

// DBProtect Test - Kinda done
// var mapper = new DBProtectMapper(fs.readFileSync('/Users/rlin/Desktop/Samples/DbProtectCheckResultsDetailsXML.xml', { encoding: 'utf-8' }))
// //fs.writeFileSync('libs/heimdall_tools/converted_jsons/dbprotectJson.json', JSON.stringify(mapper.data))
// fs.writeFileSync('libs/heimdall_tools/outputs/dbprotect.json', JSON.stringify(mapper.toHdf()))

// FortifyMapper Test - Complete!
// var mapper = new FortifyMapper(fs.readFileSync('/Users/rlin/Desktop/Samples/fortify_webgoat_results.fvdl', { encoding: 'utf-8' }))
// //fs.writeFileSync('libs/heimdall_tools/converted_jsons/fortifyJson.json', JSON.stringify(mapper.data))
// fs.writeFileSync('libs/heimdall_tools/outputs/fortify.json', JSON.stringify(mapper.toHdf()))

// Nessus Test
// var mapper = new NessusResults(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nessus_mapper/sample_input_report/nessus_sample.nessus', { encoding: 'utf-8' }))
// // fs.writeFileSync('libs/heimdall_tools/converted_jsons/nessusJson.json', JSON.stringify(mapper.data))
// let result = mapper.toHdf()
// if (Array.isArray(result)) {
//   result.forEach(element => {
//     fs.writeFileSync(`libs/heimdall_tools/outputs/nessus-${_.get(element, 'platform.target_id')}.json`, JSON.stringify(element))
//   })
// } else {
//   fs.writeFileSync('libs/heimdall_tools/outputs/nessus.json', JSON.stringify(result))
// }

// Netsparker Test - Complete!
// var mapper = new NetsparkerMapper(fs.readFileSync('/Users/rlin/Desktop/Samples/scan-report-www.example.com-vulnerabilities-01_10_2020_11_23_AM.xml', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/converted_jsons/netsparkerJson.json', JSON.stringify(mapper.data))
// fs.writeFileSync('libs/heimdall_tools/outputs/netsparker.json', JSON.stringify(mapper.toHdf()))

// Nikto Test - Complete!
// var mapper = new NiktoMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nikto_mapper/sample_input_jsons/zero.webappsecurity.json', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/nikto.json', JSON.stringify(mapper.toHdf()))

// Sarif Test - Complete!
// var mapper = new SarifMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/sarif_mapper/sample_input_jsons/sarif_input.sarif', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/sarif.json', JSON.stringify(mapper.toHdf()))

// ScoutSuite Test - Complete!
// var mapper = new ScoutsuiteMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/scoutsuite_mapper/sample_input_jsons/scoutsuite_sample.js', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/scoutsuite.json', JSON.stringify(mapper.toHdf()))

// Snyk Test - Complete!
// var mapper = new SnykResults(fs.readFileSync('/Users/rlin/Desktop/Samples/Sensitive-Snyk_multiple_projects_input.json', { encoding: 'utf-8' }))
// let result = mapper.toHdf()
// if (Array.isArray(result)) {
//   result.forEach(element => {
//     fs.writeFileSync(`libs/heimdall_tools/outputs/snyk-${_.get(element, 'platform.target_id')}.json`, JSON.stringify(element))
//   })
// } else {
//   fs.writeFileSync('libs/heimdall_tools/outputs/snyk.json', JSON.stringify(result))
// }

// XCCDF Test - Complete!
// var mapper = new XCCDFResultsMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results.xml', { encoding: 'utf-8' }));
// fs.writeFileSync('libs/heimdall_tools/converted_jsons/xccdfJson.json', JSON.stringify(mapper.data));
// fs.writeFileSync('libs/heimdall_tools/outputs/xccdf.json', JSON.stringify(mapper.toHdf()));

// ZapMapper Test
// var mapper = new ZapMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/zap_mapper/sample_input_jsons/webgoat.json', { encoding: 'utf-8' }), 'http://mymac.com:8191')
// fs.writeFileSync('libs/heimdall_tools/outputs/zapmapper.json', JSON.stringify(mapper.toHdf()))



