import { type ExecJSON } from 'inspecjs';

export type SplunkReport = {
  meta: Meta;
  passthrough: any;
  platform: Platform;
  profiles: unknown[];
  statistics?: ExecJSON.Statistics;
  version: string;
};

export type Meta = {
  filename: string;
  filetype: string;
  guid: string;
  hdf_splunk_schema: string;
  subtype: string;
};

export type Platform = {
  name: string;
  release: string;
};
