import { ExecJSON } from 'inspecjs';
import _ from 'lodash';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter, DEFAULT_PROFILE_FIELDS } from './base-converter';
import { HeimdallToolsVersion } from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

export class TrufflehogMapper extends BaseConverter {
  shouldIncludeRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, any>): Record<string, unknown> => {
        return createHeimdallPassthrough('trufflehog', { ...(this.shouldIncludeRaw && { raw: data }) });
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    profiles: [
      {
        ...DEFAULT_PROFILE_FIELDS,
        controls: [
          {
            id: {
              transformer: (data: Record<string, unknown>): string =>
                `${String(_.get(data, 'DetectorName'))} ${String(_.get(data, 'DecoderName'))}`,
            },
            impact: 0.5,
            key: 'id',
            path: 'wrapper',
            refs: [],
            results: [
              {
                code_desc: {
                  transformer: (data: Record<string, unknown>): string =>
                    JSON.stringify(_.get(data, 'SourceMetadata'), null, 2),
                },
                message: {
                  transformer: (data: Record<string, unknown>): string =>
                    JSON.stringify(
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
                    ),
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
                `Found ${String(_.get(data, 'DetectorName'))} secret using ${String(_.get(data, 'DecoderName'))} decoder`,
            },
          },
        ],
        name: {
          path: 'wrapper[0]',
          transformer: (data: Record<string, unknown>): string =>
            `Source ID: ${String(_.get(data, 'SourceID'))}, Source Name: ${String(_.get(data, 'SourceName'))}`,
        },
        title: { path: 'wrapper[0].SourceName' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(trufflehogJson: Record<string, unknown>, shouldIncludeRaw = false) {
    super(trufflehogJson, true);
    this.shouldIncludeRaw = shouldIncludeRaw;
  }
}

export class TrufflehogResults {
  data: Record<string, unknown>;
  shouldIncludeRaw: boolean;
  constructor(trufflehogJson: string, shouldIncludeRaw = false) {
    let parsedData;
    try {
      parsedData = JSON.parse(trufflehogJson.trim());
    } catch {
      parsedData = trufflehogJson
        .trim()
        .split('\n')
        .map(line => JSON.parse(line.trim()));
    }
    this.shouldIncludeRaw = shouldIncludeRaw;
    this.data = _.isArray(parsedData) ? { wrapper: parsedData } : { wrapper: [parsedData] };
  }

  toHdf(): ExecJSON.Execution {
    return new TrufflehogMapper(this.data, this.shouldIncludeRaw).toHdf();
  }
}
