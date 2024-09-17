import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';

export class NeuvectorMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: null //Insert data
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null //Insert data
    },
    profiles: [
      {
        name: 'Neuvector', //Insert data
        title: null, //Insert data
        version: null, //Insert data
        maintainer: null, //Insert data
        summary: null, //Insert data
        license: null, //Insert data
        copyright: null, //Insert data
        copyright_email: null, //Insert data
        supports: [], //Insert data
        attributes: [], //Insert data
        depends: [], //Insert data
        groups: [], //Insert data
        status: 'loaded', //Insert data
        controls: [
          {
            key: 'id',
            tags: {}, //Insert data
            descriptions: [], //Insert data
            refs: [], //Insert data
            source_location: {}, //Insert data
            title: null, //Insert data
            id: '', //Insert data
            desc: null, //Insert data
            impact: 0, //Insert data
            code: null, //Insert data
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed, //Insert data
                code_desc: '', //Insert data
                message: null, //Insert data
                run_time: null, //Insert data
                start_time: '' //Insert data
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, any>): Record<string, unknown> => {
        return {
          auxiliary_data: [{name: '', data: _.omit([])}], //Insert service name and mapped fields to be removed
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(exportJson: string, withRaw = false) {
    super(JSON.parse(exportJson), true);
    this.withRaw = withRaw;
  }
}
