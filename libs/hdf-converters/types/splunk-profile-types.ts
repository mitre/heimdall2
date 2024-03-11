import {ILookupPathFH} from '../src/converters-from-hdf/reverse-base-converter';

export type SplunkProfile = {
  meta: Meta;
  summary: string;
  sha256: string;
  controls: unknown[];
  supports: any[] | ILookupPathFH;
  name: string;
  copyright: string;
  maintainer: string;
  copyright_email: string;
  version: string;
  license: string;
  title: string;
  parent_profile: string | undefined;
  depends: Depend[] | ILookupPathFH;
  attributes: Attribute[] | ILookupPathFH;
  groups: Group[] | ILookupPathFH;
  status: string;
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
  name: string;
  url: string;
  git: string;
  branch: string;
  path: string;
  skip_message: string;
  status: string;
  supermarket: string;
  compliance: string;
};

export type Group = {
  controls: string[];
  id: string;
};

export type Meta = {
  guid: string;
  filetype: string;
  filename: string;
  subtype: string;
  profile_sha256: string;
  hdf_splunk_schema: string;
  is_baseline: boolean;
};
