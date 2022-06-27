import {ExecJSON} from 'inspecjs';

export type SplunkReport = {
  meta: Meta;
  statistics?: ExecJSON.Statistics;
  passthrough: any;
  profiles: unknown[];
  platform: Platform;
  version: string;
};

export type Meta = {
  guid: string;
  filename: string;
  filetype: string;
  subtype: string;
  hdf_splunk_schema: string;
};

export type Platform = {
  release: string;
  name: string;
};
