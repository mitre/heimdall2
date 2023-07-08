import {ExecJSON} from 'inspecjs';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';

const PROFILE_NAME = 'GRYPE';

function convertToControlMapping(): MappedTransform<
  ExecJSON.Control,
  ILookupPath
> {
  return {
    id: {path: 'vulnerability.id'},
    title: {path: 'artifact.name'},
    desc: {path: 'relatedVulnerabilities[0].description'}, //does relatedvulnerabilities always have the same cve as the vulnerability as the first element? check this
    impact: {path: ''}, //to do
    refs: [],
    tags: {}, // to do
    source_location: {
      ref: {path: 'artifact.locations[0].path'} //multiple locations can be provided by grype, but only one goes into hdf
    },
    results: []
  };
}
export class GrypeMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    passthrough: {path: '.'},
    platform: {
      //should it really be heimdall tools? shouldn't it be the platform in grype results?
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: {path: 'descriptor.version'},
    statistics: {},
    profiles: [
      {
        name: PROFILE_NAME,
        version: {path: 'descriptor.version'},
        title: PROFILE_NAME,
        supports: [],
        sha256: '',
        controls: [
          {
            path: 'matches',
            ...convertToControlMapping()
          }
        ],
        attributes: [],
        groups: []
      }
    ]
  };
  constructor(grypeJson: string) {
    super(JSON.parse(grypeJson));
  }
}
