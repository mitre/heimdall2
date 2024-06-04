import {HDFControlSegment} from 'inspecjs';
import {ILookupPathFH} from '../src/converters-from-hdf/reverse-base-converter';

export type SplunkControl = {
  meta: Meta;
  code: string;
  desc: string;
  title?: string | null;
  descriptions: Record<string, string>[] | ILookupPathFH;
  id: string;
  impact: number;
  refs: any[] | ILookupPathFH;
  results?: HDFControlSegment[] | ILookupPathFH;
  source_location?: any;
  tags: Tags;
};

export type Meta = {
  guid: string;
  filename: string;
  filetype: string;
  subtype: string;
  profile_sha256: string;
  hdf_splunk_schema: string;
  status: string;
  is_waived: boolean;
  is_baseline: boolean;
  overlay_depth: number;
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

export type Tags = {
  check?: string;
  fix?: string;
  nist?: string[];
};
