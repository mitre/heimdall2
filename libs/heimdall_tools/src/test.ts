import fs from 'fs';
import {BurpSuiteMapper} from './burpsuite-mapper';

// Burpsuite Test
const mapper = new BurpSuiteMapper(
  fs.readFileSync(
    '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min',
    {encoding: 'utf-8'}
  )
);
fs.writeFileSync(
  'libs/heimdall_tools/converted_jsons/burpsJson.json',
  JSON.stringify(mapper.data)
);
fs.writeFileSync(
  'libs/heimdall_tools/outputs/burpsuite.json',
  JSON.stringify(mapper.toHdf())
);

// JFrog Test
// var mapper = new JfrogXrayMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/outputs/jfrog.json', JSON.stringify(mapper.toHdf()))

// Nessus Test
// var mapper = new NessusMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nessus_mapper/sample_input_report/nessus_sample.nessus', { encoding: 'utf-8' }))
// fs.writeFileSync('libs/heimdall_tools/converted_jsons/nessusJson.json', JSON.stringify(mapper.data))
// fs.writeFileSync('libs/heimdall_tools/outputs/nessus.json', JSON.stringify(mapper.toHdf()))
