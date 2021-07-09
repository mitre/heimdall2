import { ControlResultStatus, ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import { MappedTransform, LookupPath, BaseConverter, generateHash } from './base-converter'

const mappings: MappedTransform<ExecJSON, LookupPath> = {
  platform: {
    name: 'Heimdall Tools',
    release: HeimdallToolsVersion,
    target_id: { path: 'projectName' }
  },
  version: HeimdallToolsVersion,
  statistics: {
    duration: null
  },
  profiles: [
    {
      name: { path: 'policy' },
      version: { path: 'version' },
      title: {
        path: 'projectName', transformer: (input: string): string => {
          return `SnykProject: ${input}`
        }
      },
      maintainer: null,
      summary: 'Continuous Security and Universal Artifact Analysis',
      license: null,
      copyright: null,
      copyright_email: null,
      supports: [],
      attributes: [],
      depends: [],
      groups: [],
      status: 'loaded',
      controls: [
        {
          path: 'data',
          key: 'id',
          tags: {
            //nist: { path: 'component_versions.more_details.cves[0].cwe[0]' },
            cweid: { path: 'CWE' },
            cveid: { path: 'CVE' },
            ghsaid: { path: 'GHSA' }
          },
          descriptions: [],
          refs: [],
          source_location: {},
          id: {},
          title: { path: 'summary' },
          desc: { path: 'component_versions.more_details' },
          impact: { path: 'severity' },
          code: '',
          results: [
            {
              status: ControlResultStatus.Failed,
              code_desc: {},
              run_time: 0,
              start_time: ''
            }
          ]
        }
      ],
      sha256: ''
    }
  ]
};
const mappings2: MappedTransform<ExecJSON, LookupPath> = {
  platform: {
    name: 'Heimdall Tools',
    target_id: { path: 'projectName' },
    release: HeimdallToolsVersion
  },
  profiles: [
    {
      name: { path: 'policy' },
      version: 'version',
      title: `Snyk Project: ${{ path: 'projectName' }}`,
      attributes: [],
      controls: [
        {
          tags: {
            // Waiting for processing functions
          },
          descriptions: [],
          refs: [],
          source_location: {},
          title: { path: '[INDEX].vulnerabilities[INDEX].title' },
          id: { path: '[INDEX].vulnerabilities[INDEX].id' },
          desc: { path: '[INDEX].vulnerabilities[INDEX].description' },
          impact: { path: '[INDEX].vulnerabilities[INDEX].severity' },
          code: '',
          results: []
        }
      ],
      groups: [],
      summary: `Snyk Summary: ${{ path: 'summary' }}`,
      supports: [],
      sha256: ''
    }
  ],
  statistics: {},
  version: HeimdallToolsVersion
};

class SnykMapper {
  snykJson: JSON;

  constructor(snykJson: string) {
    this.snykJson = JSON.parse(snykJson.split('\n', 1)[1]);
  }
}
