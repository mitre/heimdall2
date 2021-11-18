/////Interfaces for ExecJSON focused on ASFF

export interface IOptions {
  input: string;
  awsAccountId: string;
  target: string;
  region: string;
}

export interface IExecJSONASFF {
  Findings: IFindingASFF[];
}

export interface IFindingASFF {
  SchemaVersion: string;
  Id: string;
  ProductArn: string;
  ProductName?: string;
  CompanyName?: string;
  Region?: string;
  GeneratorId: string;
  AwsAccountId: string;
  Types?: string[] | Record<string, unknown>;
  FirstObservedAt?: string;
  LastObservedAt?: string;
  CreatedAt: string;
  UpdatedAt: string;
  Severity: ISeverityASFF;
  Title: string;
  Description: string;
  Remediation: IRemediationASFF;
  ProductFields: IProductFieldsASFF;
  Resources: IResourcesASFF[];
  Compliance: IComplianceASFF;
  WorkflowState?: string;
  Workflow?: {Status: string};
  RecordState?: string;
  FindingProviderFields: IFindingProviderFieldsASFF;
}

export interface ISeverityASFF {
  Product?: number;
  Label: string;
  Normalized?: number;
  Original?: string;
}

export interface IRemediationASFF {
  Recommendation: {Text: string; Url?: string};
}

export interface IProductFieldsASFF {
  Check?: string | Record<string, unknown>;
  StandardsGuideArn?: string;
  StandardsGuideSubscriptionArn?: string;
  RuleId?: string;
  RecommendationUrl?: string;
  StandardsControlArn?: string;
  'aws/securityhub/ProductName'?: string;
  'aws/securityhub/CompanyName'?: string;
  'aws/securityhub/annotation'?: string;
  'Resources:0/Id'?: string;
  'aws/securityhub/FindingId'?: string;
}

export interface IResourcesASFF {
  Type: string;
  Id: string;
  Partition?: string;
  Region?: string;
  Details?: {
    AwsIamRole: {AssumeRolePolicyDocument: string | Record<string, unknown>};
  };
}

export interface IComplianceASFF {
  Status: string;
  StatusReasons?: ({
    ReasonCode: string | null;
    Description: string | null;
  } | null)[];
  RelatedRequirements?: string[] | Record<string, unknown>;
}
export interface IFindingProviderFieldsASFF {
  Severity: {Label: string; Original?: string};
  Types: string[] | Record<string, unknown>;
}
