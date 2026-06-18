import { ExecJSON } from 'inspecjs';
import _ from 'lodash';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter } from './base-converter';
import { HeimdallToolsVersion } from './utils/global';

export class TrufflehogMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, any>): Record<string, unknown> => {
        return { ...(this.withRaw && { raw: data }) };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            id: {
              transformer: (data: Record<string, unknown>): string =>
                `${_.get(data, 'DetectorName')} ${_.get(data, 'DecoderName')}`,
            },
            impact: 0.5,
            key: 'id',
            path: 'wrapper',
            refs: [],
            results: [
              {
                code_desc: {
                  transformer: (data: Record<string, unknown>): string =>
                    `${JSON.stringify(_.get(data, 'SourceMetadata'), null, 2)}`,
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
                          'StructuredData',
                        ]),
                        value => value === null || value === '',
                      ),
                      null,
                      2,
                    )}`,
                },
                start_time: '',
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: ['CCI-004069', 'CCI-000202', 'CCI-000203', 'CCI-002367'],
              nist: ['IA-5(7)'],
              severity: 'medium',
            },
            title: {
              transformer: (data: Record<string, unknown>): string =>
                `Found ${_.get(data, 'DetectorName')} secret using ${_.get(data, 'DecoderName')} decoder`,
            },
          },
        ],
        groups: [],
        name: {
          path: 'wrapper[0]',
          transformer: (data: Record<string, unknown>): string =>
            `Source ID: ${_.get(data, 'SourceID')}, Source Name: ${_.get(data, 'SourceName')}`,
        },
        sha256: '',
        status: 'loaded',
        supports: [],
        title: { path: 'wrapper[0].SourceName' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(trufflehogJson: Record<string, unknown>, withRaw = false) {
    super(trufflehogJson, true);
    this.withRaw = withRaw;
  }
}

export class TrufflehogResults {
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(trufflehogJson: string, withRaw = false) {
    let parsedData;
    try {
      parsedData = JSON.parse(trufflehogJson.trim());
    } catch {
      parsedData = trufflehogJson
        .trim()
        .split('\n')
        .map(line => JSON.parse(line.trim()));
    }
    this.withRaw = withRaw;
    this.data = _.isArray(parsedData) ? { wrapper: parsedData } : { wrapper: [parsedData] };
  }

  toHdf(): ExecJSON.Execution {
    return new TrufflehogMapper(this.data, this.withRaw).toHdf();
  }
}
