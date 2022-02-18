export type SplunkReport = {
  meta: Meta;
  statistics: Statistics;
  platform: Platform;
  version: string;
};

export type Meta = {
  guid: string;
  filename: string;
  filetype: string;
  subtype: string;
  parse_time: Date;
  start_time: Date;
  hdf_splunk_schema: string;
};

export type Platform = {
  release: string;
  name: string;
};

export type Statistics = {
  duration: number;
};
