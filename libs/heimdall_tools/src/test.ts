import fs from 'fs';
import { BurpSuiteMapper } from './burpsuite-mapper';
import { JfrogXrayMapper } from './jfrog-xray-mapper';
//import { NessusMapper } from './nessus-mapper';
import { NiktoMapper } from './nikto-mapper';
import { SarifMapper } from './sarif-mapper';
import { ScoutsuiteMapper } from './scoutsuite-mapper';
import { XCCDFResultsMapper } from './xccdf-results-mapper';


// Burpsuite Test - Complete!
// var mapper = new BurpSuiteMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min', { encoding: 'utf-8' }));
// fs.writeFileSync('libs/heimdall_tools/converted_jsons/burpsJson.json', JSON.stringify(mapper.data));
// fs.writeFileSync('libs/heimdall_tools/outputs/burpsuite.json', JSON.stringify(mapper.toHdf()));

// JFrog Test - Complete!
// var mapper = new JfrogXrayMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/jfrog.json', JSON.stringify(mapper.toHdf()))

// Nessus Test
// var mapper = new NessusMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nessus_mapper/sample_input_report/nessus_sample.nessus', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/converted_jsons/nessusJson.json', JSON.stringify(mapper.data))
// fs.writeFileSync('libs/heimdall_tools/outputs/nessus.json', JSON.stringify(mapper.toHdf()))

// Nikto Test - Complete!
// var mapper = new NiktoMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nikto_mapper/sample_input_jsons/zero.webappsecurity.json', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/nikto.json', JSON.stringify(mapper.toHdf()))

// Sarif Test - Complete!
// var mapper = new SarifMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/sarif_mapper/sample_input_jsons/sarif_input.sarif', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/sarif.json', JSON.stringify(mapper.toHdf()))

// ScoutSuite Test - Complete!
// var mapper = new ScoutsuiteMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/scoutsuite_mapper/sample_input_jsons/scoutsuite_sample.js', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/scoutsuite.json', JSON.stringify(mapper.toHdf()))

// XCCDF Test
var mapper = new XCCDFResultsMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results.xml', { encoding: 'utf-8' }));
fs.writeFileSync('libs/heimdall_tools/converted_jsons/xccdfJson.json', JSON.stringify(mapper.data));
fs.writeFileSync('libs/heimdall_tools/outputs/xccdf.json', JSON.stringify(mapper.toHdf()));

