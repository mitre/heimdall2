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
  description: string;
  maintainer: string;
  date: string;
  source: string;
  groups: XCCDFGroup[];
};

export type XCCDFData = {
  hdfConvertersVersion: string;
  profiles: XCCDFProfile[];
};

export type Identifier = {system: string; value: string};
