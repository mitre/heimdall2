export type XCCDFData = {
  profile: {
    title: string;
    description: string;
    maintainer: string;
    source: string;
    converterVersion: string;
  };
  groups: {
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
  }[];
};

export type Identifier = {system: string; value: string};
