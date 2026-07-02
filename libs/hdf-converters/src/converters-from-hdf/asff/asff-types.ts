/// //Interfaces for ExecJSON focused on ASFF

export type IOptions = {
  awsAccountId: string;
  input: string;
  region: string;
  regionAttribute?: boolean;
  target: string;
};

export type IExecJSONASFF = { Findings: IFindingASFF[] };

export type IFindingASFF = {
  AwsAccountId: string;
  CompanyName?: string;
  Compliance: IComplianceASFF;
  CreatedAt: string;
  Description: string;
  FindingProviderFields: IFindingProviderFieldsASFF;
  FirstObservedAt?: string;
  GeneratorId: string;
  Id: string;
  LastObservedAt?: string;
  ProductArn: string;
  ProductFields: IProductFieldsASFF;
  ProductName?: string;
  RecordState?: string;
  Region?: string;
  Remediation: IRemediationASFF;
  Resources: IResourcesASFF[];
  SchemaVersion: string;
  Severity: ISeverityASFF;
  Title: string;
  Types?: Record<string, unknown> | string[];
  UpdatedAt: string;
  Workflow?: { Status: string };
  WorkflowState?: string;
};

export type ISeverityASFF = {
  Label: string;
  Normalized?: number;
  Original?: string;
  Product?: number;
};

export type IRemediationASFF = { Recommendation: { Text: string; Url?: string } };

export type IProductFieldsASFF = {
  'aws/securityhub/annotation'?: string;
  'aws/securityhub/CompanyName'?: string;
  'aws/securityhub/FindingId'?: string;
  'aws/securityhub/ProductName'?: string;
  Check?: Record<string, unknown> | string;
  RecommendationUrl?: string;
  'Resources:0/Id'?: string;
  RuleId?: string;
  StandardsControlArn?: string;
  StandardsGuideArn?: string;
  StandardsGuideSubscriptionArn?: string;
};

export type IResourcesASFF = {
  Details?: { AwsIamRole: { AssumeRolePolicyDocument: Record<string, unknown> | string } };
  Id: string;
  Partition?: string;
  Region?: string;
  Type: string;
};

export type IComplianceASFF = {
  RelatedRequirements?: Record<string, unknown> | string[];
  Status: string;
  StatusReasons?: (null | {
    Description: null | string;
    ReasonCode: null | string;
  })[];
};
export type IFindingProviderFieldsASFF = {
  Severity: { Label: string; Original?: string };
  Types: Record<string, unknown> | string[];
};
