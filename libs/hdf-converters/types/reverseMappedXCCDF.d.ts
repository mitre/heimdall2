export type MappedXCCDFtoHDF = { Benchmark: Benchmark };

export type Benchmark = {
  date: string;
  id: string;
  metadata: MetaData;
  passthrough: string;
  Profile: Profile[];
  Rule: Rule[];
  TestResult: {
    // Any as defined by InSpec Inputs, matching InSpecJS
    attributes: Record<string, any>[];
    endTime: string;
    hasAttributes: boolean;
    results: TestResult[];
  };
  title: string;
  version: string;
};

export type Profile = {
  description: string;
  id: string;
  select: string[];
  title: string;
};

export type Rule = {
  ccis: string[];
  checkContent?: string;
  code?: string;
  description?: string;
  fix?: string;
  groupId?: string;
  id: string;
  rationale?: string;
  title?: string;
  warning?: string;
};

export type MetaData = {
  copyright?: string;
  maintainer?: string;
};

export type XCCDFSeverity = 'high' | 'info' | 'low' | 'medium';

export type TestResultStatus
  = | 'error'
    | 'fail'
    | 'fixed'
    | 'informational'
    | 'notapplicable'
    | 'notchecked'
    | 'notselected'
    | 'pass'
    | 'unknown';

export type TestResult = {
  code: string;
  idref: string;
  message: string;
  messageType: string;
  result: TestResultStatus;
};
