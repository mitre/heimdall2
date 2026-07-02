import { HeimdallToolsVersion } from './global';

export type HeimdallMetadata = {
  sourceFormat: string;
  toolVersion: string;
};

export function createHeimdallPassthrough(
  sourceFormat: string,
  extra?: Record<string, unknown>,
): Record<string, unknown> & { heimdall: HeimdallMetadata } {
  return {
    ...extra,
    heimdall: {
      sourceFormat,
      toolVersion: HeimdallToolsVersion,
    },
  };
}
