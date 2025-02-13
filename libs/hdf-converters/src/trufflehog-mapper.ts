import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';

export class TrufflehogResults {
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(trufflehogJson: string, withRaw = false) {
    let parsedData = {};
    try {
      parsedData = JSON.parse(trufflehogJson.trim());
    }
    catch (e) {
      parsedData = trufflehogJson.trim().split("\n").map((line) => JSON.parse(line.trim()));
    }
    this.withRaw = withRaw;
    if (_.isArray(parsedData)) {
      this.data = {wrapper: parsedData};
    } else {
      this.data = {wrapper: [parsedData]};
    }
  }

  toHdf(): ExecJSON.Execution {
    return new TrufflehogMapper(this.data, this.withRaw).toHdf();
  }
}

export class TrufflehogMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: {
          path: 'wrapper[0]',
          transformer: (data: Record<string, unknown>): string =>
            `Source ID: ${_.get(data, 'SourceID')}, Source Name: ${_.get(data, 'SourceName')}`
        },
        title: {path: 'wrapper[0].SourceName'},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            key: 'id',
            path: 'wrapper',
            tags: {
              nist: ['IA-5(7)'],
              cci: ['CCI-004069', 'CCI-000202', 'CCI-000203', 'CCI-002367'],
              severity: 'medium'
            },
            refs: [],
            source_location: {},
            title: {
              transformer: (data: Record<string, unknown>): string =>
                `Found ${_.get(data, 'DetectorName')} secret using ${_.get(data, 'DecoderName')} decoder`
            },
            id: {
              transformer: (data: Record<string, unknown>): string =>
                `${_.get(data, 'DetectorName')} ${_.get(data, 'DecoderName')}`
            },
            impact: 0.5,
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  transformer: (data: Record<string, unknown>): string =>
                    `${JSON.stringify(_.get(data, 'SourceMetadata'), null, 2)}`
                },
                message: {
                  transformer: (data: Record<string, unknown>): string =>
                    `${JSON.stringify(
                      _.omitBy(
                        _.pick(data, [
                          'Verified',
                          'VerificationError',
                          'Raw',
                          'RawV2',
                          'Redacted',
                          'ExtraData',
                          'StructuredData'
                        ]),
                        (value) => value === null || value === ''
                      ),
                      null,
                      2
                    )}`
                },
                start_time: ''
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
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(trufflehogJson: Record<string, unknown>, withRaw = false) {
    super(trufflehogJson, true);
    this.withRaw = withRaw;
  }
}
