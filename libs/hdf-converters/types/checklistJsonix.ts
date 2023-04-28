export type ChecklistJSONIX = {
  name: ChecklistJsonixName;
  value: ChecklistJsonixValue;
};

export type ChecklistJsonixName = {
  key: string;
  localPart: string;
  namespaceURI: string;
  prefix: string;
  string: string;
};

export type ChecklistJsonixValue = {
  TYPE_NAME: string;
  asset: ChecklistJsonixAsset;
  stigs: ChecklistJsonixStigs;
};

export type ChecklistJsonixAsset = {
  TYPE_NAME: string;
  assettype: 'Computing' | 'Non-Computing';
  hostfqdn: string;
  hostip: string;
  hostmac: string;
  hostname: string;
  marking: string;
  role: 'None' | 'Workstation' | 'Member Server' | 'Domain Controller';
  targetcomment: string;
  targetkey: string;
  techarea:
    | ''
    | 'Application Review'
    | 'Boundary Security'
    | 'CDS Admin Review'
    | 'CDS Technical Review'
    | 'Database Review'
    | 'Domain Name System (DNS)'
    | 'Exchange Server'
    | 'Host Based System Security (HBSS)'
    | 'Internal Network'
    | 'Mobility'
    | 'Releasable Networks (REL)'
    | 'Releaseable Networks (REL)'
    | 'Traditional Security'
    | 'UNIX OS'
    | 'VVOIP Review'
    | 'Web Review'
    | 'Windows OS'
    | 'Other Review';
  webdbinstance: string;
  webdbsite: string;
  webordatabase: boolean;
};

export type ChecklistJsonixStigs = {
  TYPE_NAME: string;
  istig: ChecklistJsonixIstig[];
};

export type ChecklistJsonixIstig = {
  TYPE_NAME: string;
  stiginfo: ChecklistJsonixStigInfo;
  vuln: ChecklistJsonixVuln[];
};

export type ChecklistJsonixStigInfo = {
  TYPE_NAME: string;
  sidata: ChecklistJsonixSiData[];
};

export type ChecklistJsonixSiData = {
  TYPE_NAME: string;
  sidata?: string;
  sidname:
    | 'classification'
    | 'customname'
    | 'description'
    | 'filename'
    | 'notice'
    | 'releaseinfo'
    | 'source'
    | 'stigid'
    | 'title'
    | 'uuid'
    | 'version';
};

export type ChecklistJsonixVuln = {
  TYPE_NAME: string;
  comments: string;
  findingdetails: string;
  severityjustification: string;
  severityoverride: '' | 'low' | 'medium' | 'high';
  status: 'NotAFinding' | 'Open' | 'Not_Applicable' | 'Not_Reviewed';
  stigdata: ChecklistJsonixStigData[];
};

export type ChecklistJsonixStigData = {
  TYPE_NAME: string;
  attributedata?: string;
  vulnattribute:
    | 'CCI_REF'
    | 'Check_Content_Ref'
    | 'Class'
    | 'Documentable'
    | 'False_Negatives'
    | 'False_Positives'
    | 'Fix_Text'
    | 'Group_Title'
    | 'IA_Controls'
    | 'Mitigation_Control'
    | 'Mitigations'
    | 'Potential_Impact'
    | 'Responsibility'
    | 'Rule_ID'
    | 'Rule_Title'
    | 'Rule_Ver'
    | 'STIGRef'
    | 'Security_Override_Guidance'
    | 'Severity'
    | 'Third_Party_Tools'
    | 'Vuln_Discuss'
    | 'Vuln_Num'
    | 'Weight'
    | 'TargetKey'
    | 'STIG_UUID'
    | 'LEGACY_ID';
};
