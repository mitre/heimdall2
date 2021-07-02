import { JfrogXrayMapper } from './jfrog-xray-mapper'
import fs from 'fs'

var mapper = new JfrogXrayMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', { encoding: 'utf-8' }))
fs.writeFileSync('libs/heimdall_tools/src/myoutput.json', JSON.stringify(mapper.toHdf()))
