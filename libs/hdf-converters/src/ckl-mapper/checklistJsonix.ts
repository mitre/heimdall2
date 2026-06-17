/**
 * Checklist type defines the JSONIX data structure that is the result of the unmarshalString
 * function from an XML string and is the required data object used in the marshalString to
 * result an XML string utilizing the mapping object found in jsonixMapping.ts
 */
export type Checklist = {
  name?: Name;
  value?: boolean | null | Stigdata | string;
};

export type Name = {
  localPart: LocalPartEnum;
  namespaceURI?: string;
  prefix?: null | string;
};

export enum LocalPartEnum {
  Asset = 'ASSET',
  AssetType = 'ASSET_TYPE',
  AttributeData = 'ATTRIBUTE_DATA',
  Checklist = 'CHECKLIST',
  Comments = 'COMMENTS',
  FindingDetails = 'FINDING_DETAILS',
  HostFQDN = 'HOST_FQDN',
  HostGUID = 'HOST_GUID',
  HostIP = 'HOST_IP',
  HostMAC = 'HOST_MAC',
  HostName = 'HOST_NAME',
  ISTIG = 'iSTIG',
  Marking = 'MARKING',
  Role = 'ROLE',
  SeverityJustification = 'SEVERITY_JUSTIFICATION',
  SeverityOverride = 'SEVERITY_OVERRIDE',
  SiData = 'SI_DATA',
  SidData = 'SID_DATA',
  SidName = 'SID_NAME',
  Status = 'STATUS',
  StigData = 'STIG_DATA',
  StigGUID = 'STIG_GUID',
  StigInfo = 'STIG_INFO',
  Stigs = 'STIGS',
  TargetComment = 'TARGET_COMMENT',
  TargetKey = 'TARGET_KEY',
  TechArea = 'TECH_AREA',
  Vuln = 'VULN',
  VulnAttribute = 'VULN_ATTRIBUTE',
  WebDBInstance = 'WEB_DB_INSTANCE',
  WebDBSite = 'WEB_DB_SITE',
  WebOrDatabase = 'WEB_OR_DATABASE',
}

export type Stigdata = {
  asset?: Asset;
  assettype?: Assettype;
  attributedata?: null | string;
  comments?: null | string;
  findingdetails?: null | string;
  hostfqdn?: null | string;
  hostguid?: null | string;
  hostip?: null | string;
  hostmac?: null | string;
  hostname?: null | string;
  istig?: Istig[];
  marking?: null | string;
  role?: Role;
  severityjustification?: null | string;
  severityoverride?: Severityoverride;
  sidata?: Sidata[];
  siddata?: null | string;
  sidname?: Sidname;
  status?: Status;
  stigdata?: StigdatumElement[];
  stigguid?: null | string;
  stiginfo?: Stiginfo;
  stigs?: Stigs;
  targetcomment?: null | string;
  targetkey?: null | string;
  techarea?: Techarea;
  vuln?: Vuln[];
  vulnattribute?: Vulnattribute;
  webdbinstance?: null | string;
  webdbsite?: null | string;
  webordatabase?: boolean | null;
};

export type Asset = {
  assettype: Assettype;
  hostfqdn: null | string;
  hostguid?: null | string;
  hostip: null | string;
  hostmac: null | string;
  hostname: null | string;
  marking?: null | string;
  role: Role;
  stigguid?: null | string;
  targetcomment?: null | string;
  targetkey: null | string;
  techarea: Techarea;
  webdbinstance: null | string;
  webdbsite: null | string;
  webordatabase: boolean | null;
};

export enum Assettype {
  Computing = 'Computing',
  NonComputing = 'Non-Computing',
}

export enum Role {
  DomainController = 'Domain Controller',
  MemberServer = 'Member Server',
  None = 'None',
  Workstation = 'Workstation',
}

export enum Techarea {
  ApplicationReview = 'Application Review',
  BoundarySecurity = 'Boundary Security',
  CDSAdminReview = 'CDS Admin Review',
  CDSTechnicalReview = 'CDS Technical Review',
  DatabaseReview = 'Database Review',
  DomainNameSystemDNS = 'Domain Name System (DNS)',
  Empty = '',
  ExchangeServer = 'Exchange Server',
  HostBasedSystemSecurityHBSS = 'Host Based System Security (HBSS)',
  InternalNetwork = 'Internal Network',
  Mobility = 'Mobility',
  OtherReview = 'Other Review',
  ReleasableNetworksREL = 'Releasable Networks (REL)',
  ReleaseableNetworksREL = 'Releaseable Networks (REL)',
  TraditionalSecurity = 'Traditional Security',
  UnixOS = 'UNIX OS',
  VVOIPReview = 'VVOIP Review',
  WebReview = 'Web Review',
  WindowsOS = 'Windows OS',
}

export type Istig = {
  stiginfo: Stiginfo;
  vuln: Vuln[];
};

export type Stiginfo = { sidata: Sidata[] };

export type Sidata = {
  siddata?: null | string;
  sidname: Sidname;
};

export enum Sidname {
  Classification = 'classification',
  Customname = 'customname',
  Description = 'description',
  Filename = 'filename',
  Notice = 'notice',
  Releaseinfo = 'releaseinfo',
  Source = 'source',
  Stigid = 'stigid',
  Title = 'title',
  UUID = 'uuid',
  Version = 'version',
}

export type Vuln = {
  comments: null | string;
  findingdetails: null | string;
  severityjustification: null | string;
  severityoverride: Severityoverride;
  status: Status;
  stigdata: StigdatumElement[];
};

export enum Severityoverride {
  Empty = '',
  High = 'high',
  Low = 'low',
  Medium = 'medium',
}

export enum Status {
  NotAFinding = 'NotAFinding',
  NotApplicable = 'Not_Applicable',
  NotReviewed = 'Not_Reviewed',
  Open = 'Open',
}

export type StigdatumElement = {
  attributedata: null | string;
  vulnattribute: Vulnattribute;
};

export enum Vulnattribute {
  CciRef = 'CCI_REF',
  CheckContent = 'Check_Content',
  CheckContentRef = 'Check_Content_Ref',
  Class = 'Class',
  Documentable = 'Documentable',
  FalseNegatives = 'False_Negatives',
  FalsePositives = 'False_Positives',
  FixText = 'Fix_Text',
  GroupTitle = 'Group_Title',
  IAControls = 'IA_Controls',
  LegacyID = 'LEGACY_ID',
  MitigationControl = 'Mitigation_Control',
  Mitigations = 'Mitigations',
  PotentialImpact = 'Potential_Impact',
  Responsibility = 'Responsibility',
  RuleID = 'Rule_ID',
  RuleTitle = 'Rule_Title',
  RuleVer = 'Rule_Ver',
  SecurityOverrideGuidance = 'Security_Override_Guidance',
  Severity = 'Severity',
  STIGRef = 'STIGRef',
  StigUUID = 'STIG_UUID',
  TargetKey = 'TargetKey',
  ThirdPartyTools = 'Third_Party_Tools',
  VulnDiscuss = 'Vuln_Discuss',
  VulnNum = 'Vuln_Num',
  Weight = 'Weight',
}

export type Stigs = { istig: Istig[] };
