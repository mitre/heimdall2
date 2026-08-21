import { type ILookupPathFH } from '../src/converters-from-hdf/reverse-base-converter';

export type SplunkProfile = {
  attributes: Attribute[] | ILookupPathFH;
  controls: unknown[];
  copyright: string;
  copyright_email: string;
  depends: Depend[] | ILookupPathFH;
  groups: Group[] | ILookupPathFH;
  license: string;
  maintainer: string;
  meta: Meta;
  name: string;
  parent_profile: string | undefined;
  sha256: string;
  status: string;
  summary: string;
  supports: any[] | ILookupPathFH;
  title: string;
  version: string;
};

export type Attribute = {
  name: string;
  options: Options;
};

export type Options = {
  default: string;
  required: boolean;
  type: string;
};

export type Depend = {
  branch: string;
  compliance: string;
  git: string;
  name: string;
  path: string;
  skip_message: string;
  status: string;
  supermarket: string;
  url: string;
};

export type Group = {
  controls: string[];
  id: string;
};

export type Meta = {
  filename: string;
  filetype: string;
  guid: string;
  hdf_splunk_schema: string;
  is_baseline: boolean;
  profile_sha256: string;
  subtype: string;
};
