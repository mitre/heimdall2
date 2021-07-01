import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import fs from 'fs'
import { MappedTransform, LookupPath, BaseConverter } from './base-converter'

const mappings: MappedTransform<ExecJSON, LookupPath> = {
  platform: {
    name: 'Heimdall Tools',
    release: HeimdallToolsVersion
  },
  profiles: [{
    name: 'JFrog Xray Scan',
    title: 'JFrog Xray Scan',
    version: '',
    attributes: [],
    controls: [
      {
        path: 'data',
        id: { path: 'id' },
        title: { path: 'summary' },
        desc: { path: '' },
        impact: { path: 'severity' },
        code: '',
        results: [],
        tags: {
          nist: '',
          cweid: ''
        },
        descriptions: [],
        refs: [],
        source_location: {},
      }
    ],
    groups: [],
    summary: 'Continuous Security and Universal Artifact Analysis',
    supports: [],
    sha256: ''
  }],
  statistics: {},
  version: HeimdallToolsVersion
}

class JfrogXrayMapper extends BaseConverter {
  constructor(xrayJson: string) {
    super(JSON.parse(xrayJson), mappings)
  }
}
var mapper = new JfrogXrayMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', { encoding: 'utf-8' }))
fs.writeFileSync('libs/heimdall_tools/src/myoutput.json', JSON.stringify(mapper.toHdf()))
