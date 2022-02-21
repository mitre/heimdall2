import {ILookupPathFH} from '../reverse-base-converter';

export type SplunkControl = {
  meta: Meta;
  code: string;
  desc: string;
  descriptions: Description[] | ILookupPathFH;
  id: string;
  impact: number;
  refs: any[] | ILookupPathFH;
  results?: Result[] | ILookupPathFH;
  source_location?: SourceLocation;
  tags: Tags;
};

export type Description = {
  label: string;
  data: string;
};

export type Meta = {
  guid: string;
  filename: string;
  filetype: string;
  subtype: string;
  profile_sha256: string;
  control_id: string;
  parse_time: string;
  start_time: string;
  hdf_splunk_schema: string;
  status: string;
  is_waived: boolean;
  is_baseline: boolean;
  overlay_depth: number;
  full_code: string[];
};

export type Result = {
  code_desc: string;
  run_time: number;
  start_time: Date;
  status: string;
  resource: string;
  message: string;
  skip_message: string;
  exception: string;
  backtrace: null;
};

export type SourceLocation = {
  line: number;
  ref: string;
};

export type Tags = {
  check?: string;
  fix?: string;
  nist?: string[];
};
