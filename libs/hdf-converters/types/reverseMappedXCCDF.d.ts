export type MappedXCCDFtoHDF = {
  Benchmark: Benchmark;
};

export type Benchmark = {
  id: string;
  date: string;
  title: string;
  Profile: Profile[];
  Rule: Rule[];
  metadata: MetaData;
  passthrough: string;
  version: string;
  TestResult: {
    endTime: string;
    hasAttributes: boolean;
    // Any as defined by InSpec Inputs, matching InSpecJS
    attributes: {[key: string]: any}[];
    results: TestResult[];
  };
};

export type Profile = {
  id: string;
  title: string;
  description: string;
  select: string[];
};

export type Rule = {
  groupId?: string;
  id: string;
  title?: string;
  description?: string;
  code?: string;
  warning?: string;
  rationale?: string;
  checkContent?: string;
  fix?: string;
  ccis: string[];
};

export type MetaData = {
  maintainer?: string;
  copyright?: string;
};

export type XCCDFSeverity = 'info' | 'low' | 'medium' | 'high';

export type TestResultStatus =
  | 'pass'
  | 'fail'
  | 'error'
  | 'unknown'
  | 'notapplicable'
  | 'notchecked'
  | 'notselected'
  | 'informational'
  | 'fixed';

export type TestResult = {
  idref: string;
  result: TestResultStatus;
  messageType: string;
  message: string;
  code: string;
};
