export interface Checklist {
    name?:  Name;
    value?: boolean | null | Stigdata | string;
    [property: string]: unknown;
}

export interface Name {
    localPart:     LocalPartEnum;
    namespaceURI?: string;
    prefix?:       null | string;
    [property: string]: unknown;
}

export enum LocalPartEnum {
    Asset = "ASSET",
    AssetType = "ASSET_TYPE",
    AttributeData = "ATTRIBUTE_DATA",
    Checklist = "CHECKLIST",
    Comments = "COMMENTS",
    FindingDetails = "FINDING_DETAILS",
    HostFQDN = "HOST_FQDN",
    HostGUID = "HOST_GUID",
    HostIP = "HOST_IP",
    HostMAC = "HOST_MAC",
    HostName = "HOST_NAME",
    ISTIG = "iSTIG",
    Marking = "MARKING",
    Role = "ROLE",
    SeverityJustification = "SEVERITY_JUSTIFICATION",
    SeverityOverride = "SEVERITY_OVERRIDE",
    SiData = "SI_DATA",
    SidData = "SID_DATA",
    SidName = "SID_NAME",
    Status = "STATUS",
    StigData = "STIG_DATA",
    StigGUID = "STIG_GUID",
    StigInfo = "STIG_INFO",
    Stigs = "STIGS",
    TargetComment = "TARGET_COMMENT",
    TargetKey = "TARGET_KEY",
    TechArea = "TECH_AREA",
    Vuln = "VULN",
    VulnAttribute = "VULN_ATTRIBUTE",
    WebDBInstance = "WEB_DB_INSTANCE",
    WebDBSite = "WEB_DB_SITE",
    WebOrDatabase = "WEB_OR_DATABASE",
}

export interface Stigdata {
    attributedata?:         null | string;
    vulnattribute?:         Vulnattribute;
    comments?:              null | string;
    findingdetails?:        null | string;
    severityjustification?: null | string;
    severityoverride?:      Severityoverride;
    status?:                Status;
    stigdata?:              StigdatumElement[];
    sidata?:                Sidata[];
    assettype?:             Assettype;
    hostfqdn?:              null | string;
    hostguid?:              null | string;
    hostip?:                null | string;
    hostmac?:               null | string;
    hostname?:              null | string;
    marking?:               null | string;
    role?:                  Role;
    stigguid?:              null | string;
    targetcomment?:         null | string;
    targetkey?:             null | string;
    techarea?:              Techarea;
    webdbinstance?:         null | string;
    webdbsite?:             null | string;
    webordatabase?:         boolean | null;
    asset?:                 Asset;
    stigs?:                 Stigs;
    stiginfo?:              Stiginfo;
    vuln?:                  Vuln[];
    siddata?:               null | string;
    sidname?:               Sidname;
    istig?:                 Istig[];
    [property: string]: unknown;
}

export interface Asset {
    assettype:      Assettype | unknown;
    hostfqdn:       null | string | unknown;
    hostguid?:      null | string | unknown;
    hostip:         null | string | unknown;
    hostmac:        null | string | unknown;
    hostname:       null | string | unknown;
    marking?:       null | string | unknown;
    role:           Role | unknown;
    stigguid?:      null | string | unknown;
    targetcomment?: null | string | unknown;
    targetkey:      null | string | unknown;
    techarea:       Techarea | unknown;
    webdbinstance:  null | string | unknown;
    webdbsite:      null | string | unknown;
    webordatabase:  boolean | null | unknown;
    [property: string]: unknown;
}

export enum Assettype {
    Computing = "Computing",
    NonComputing = "Non-Computing",
}

export enum Role {
    DomainController = "Domain Controller",
    MemberServer = "Member Server",
    None = "None",
    Workstation = "Workstation",
}

export enum Techarea {
    ApplicationReview = "Application Review",
    BoundarySecurity = "Boundary Security",
    CDSAdminReview = "CDS Admin Review",
    CDSTechnicalReview = "CDS Technical Review",
    DatabaseReview = "Database Review",
    DomainNameSystemDNS = "Domain Name System (DNS)",
    Empty = "",
    ExchangeServer = "Exchange Server",
    HostBasedSystemSecurityHBSS = "Host Based System Security (HBSS)",
    InternalNetwork = "Internal Network",
    Mobility = "Mobility",
    OtherReview = "Other Review",
    ReleasableNetworksREL = "Releasable Networks (REL)",
    ReleaseableNetworksREL = "Releaseable Networks (REL)",
    TraditionalSecurity = "Traditional Security",
    UnixOS = "UNIX OS",
    VVOIPReview = "VVOIP Review",
    WebReview = "Web Review",
    WindowsOS = "Windows OS",
}

export interface Istig {
    stiginfo: Stiginfo;
    vuln:     Vuln[];
    [property: string]: unknown;
}

export interface Stiginfo {
    sidata: Sidata[];
    [property: string]: unknown;
}

export interface Sidata {
    siddata?: null | string;
    sidname:  Sidname;
    [property: string]: unknown;
}

export enum Sidname {
    Classification = "classification",
    Customname = "customname",
    Description = "description",
    Filename = "filename",
    Notice = "notice",
    Releaseinfo = "releaseinfo",
    Source = "source",
    Stigid = "stigid",
    Title = "title",
    UUID = "uuid",
    Version = "version",
}

export interface Vuln {
    comments:              null | string;
    findingdetails:        null | string;
    severityjustification: null | string;
    severityoverride:      Severityoverride;
    status:                Status;
    stigdata:              StigdatumElement[];
    [property: string]: unknown;
}

export enum Severityoverride {
    Empty = "",
    High = "high",
    Low = "low",
    Medium = "medium",
}

export enum Status {
    NotAFinding = "NotAFinding",
    NotApplicable = "Not_Applicable",
    NotReviewed = "Not_Reviewed",
    Open = "Open",
}

export interface StigdatumElement {
    attributedata: null | string;
    vulnattribute: Vulnattribute;
    [property: string]: unknown;
}

export enum Vulnattribute {
    CciRef = "CCI_REF",
    CheckContent = "Check_Content",
    CheckContentRef = "Check_Content_Ref",
    Class = "Class",
    Documentable = "Documentable",
    FalseNegatives = "False_Negatives",
    FalsePositives = "False_Positives",
    FixText = "Fix_Text",
    GroupTitle = "Group_Title",
    IAControls = "IA_Controls",
    LegacyID = "LEGACY_ID",
    MitigationControl = "Mitigation_Control",
    Mitigations = "Mitigations",
    PotentialImpact = "Potential_Impact",
    Responsibility = "Responsibility",
    RuleID = "Rule_ID",
    RuleTitle = "Rule_Title",
    RuleVer = "Rule_Ver",
    STIGRef = "STIGRef",
    SecurityOverrideGuidance = "Security_Override_Guidance",
    Severity = "Severity",
    StigUUID = "STIG_UUID",
    TargetKey = "TargetKey",
    ThirdPartyTools = "Third_Party_Tools",
    VulnDiscuss = "Vuln_Discuss",
    VulnNum = "Vuln_Num",
    Weight = "Weight",
}

export interface Stigs {
    istig: Istig[];
    [property: string]: unknown;
}
