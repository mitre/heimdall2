import { type HDFControlSegment } from 'inspecjs';
import { type ILookupPathFH } from '../src/converters-from-hdf/reverse-base-converter';

export type SplunkControl = {
  code: string;
  desc: string;
  descriptions: ILookupPathFH | Record<string, string>[];
  id: string;
  impact: number;
  meta: Meta;
  refs: any[] | ILookupPathFH;
  results?: HDFControlSegment[] | ILookupPathFH;
  source_location?: any;
  tags: Tags;
  title?: null | string;
};

export type Meta = {
  filename: string;
  filetype: string;
  guid: string;
  hdf_splunk_schema: string;
  is_baseline: boolean;
  is_waived: boolean;
  overlay_depth: number;
  profile_sha256: string;
  status: string;
  subtype: string;
};

export type Result = {
  backtrace: null;
  code_desc: string;
  exception: string;
  message: string;
  resource: string;
  run_time: number;
  skip_message: string;
  start_time: Date;
  status: string;
};

export type Tags = {
  check?: string;
  fix?: string;
  nist?: string[];
};
