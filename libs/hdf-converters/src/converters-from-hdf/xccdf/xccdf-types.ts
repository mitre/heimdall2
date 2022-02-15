export type XCCDFGroup = {
  id: string;
  title: string;
  control: {
    id: string;
    title: string;
    description: string;
    identifiers: Identifier[];
    checkContent: string;
    checkId: string;
    fixContent: string;
    fixId: string;
    severity: string;
  };
};

export type XCCDFProfile = {
  title: string;
  description?: string;
  maintainer: string;
  date: string;
  source: string;
  groups: XCCDFGroup[];
  resultId: string;
  hasResults: boolean;
  results: Result[];
};

export type Result = {
  controlId: string; // Reference back to original control
  severity: string;
  result: string;
  identifiers: Identifier[];
};

export type XCCDFData = {
  hdfConvertersVersion: string;
  profiles: XCCDFProfile[];
};

export type Identifier = {system: string; value: string};
