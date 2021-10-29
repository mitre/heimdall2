/////Interfaces for ExecJSON focused on ASFF
  
export interface ExecJSONASFF {
    Findings:   FindingASFF[];
}

export interface FindingASFF {
    SchemaVersion:       string;
    Id:                  string;
    ProductArn:         string;
    ProductName?:        string;
    CompanyName?:        string;
    Region:             string;
    GeneratorId:        string;
    AwsAccountId:       string;
    Types:              string[];
    FirstObservedAt?:     string;
    LastObservedAt?:      string;
    CreatedAt:           string;
    UpdatedAt:           string;
    Severity:    SeverityASFF;
    Title:          string;
    Description:   string;
    Remediation:         RemediationASFF;
    ProductFields: ProductFieldsASFF;
    Resources:         ResourcesASFF[];
    Compliance: ComplianceASFF;
    WorkflowState?:           string;
    Workflow?:         {Status: string};
    RecordState?: string;
    FindingProviderFields: FindingProviderFieldsASFF;
}

export interface SeverityASFF {
                Product?: number;
                Label: string;
                Normalized?: number,
                Original: string
}

export interface RemediationASFF {
    Recommendation: {Text: string; Url?: string}
}

export interface ProductFieldsASFF{

    Check?: string | {};
    StandardsGuideArn?: string;
    StandardsGuideSubscriptionArn?: string;
    RuleId?: string;
    RecommendationUrl?: string;
    StandardsControlArn?: string;
    'aws/securityhub/ProductName'?:string;
    'aws/securityhub/CompanyName'?:string;
    'aws/securityhub/annotation'?:string;
    'Resources:0/Id'?:string;
    'aws/securityhub/FindingId'?:string;


}

export interface ResourcesASFF {
    Type: string;
    Id: string;
    Partition?: string;
    Region?: string;
    Details?:{AwsIamRole: {AssumeRolePolicyDocument: string|{}}}
}

export interface ComplianceASFF {
    Status: string;
    StatusReasons?: ({ReasonCode:string|null, Description:string|null } | null)[]|undefined ;
    RelatedRequirements?:string[];
}
export interface FindingProviderFieldsASFF {
    Severity: {Label: string, Original: string};
    Types: string[] |{}
}

export interface AWSCISStandard {
    "StandardsControlArn": string,
            "ControlStatus": string,
            "ControlStatusUpdatedAt": string,
            "ControlId": string,
            "Title": string,
            "Description": string,
            "RemediationUrl": string,
            "SeverityRating": string,
            "RelatedRequirements": string[]
}