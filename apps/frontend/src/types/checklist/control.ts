import {FileID} from '@/store/report_intake';

export type ChecklistFile = {
  /**
   * Unique identifier for this file. Used to encode which file is currently selected, etc.
   *
   * Note that in general one can assume that if a file A is loaded AFTER a file B, then
   * A.unique_id > B.unique_id.
   * Using this property, one might order files by order in which they were added.
   */
  uniqueId: FileID;
  /** The filename that this file was uploaded under. */
  filename: string;

  database_id?: string;

  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  raw: unknown;
};

export function mapStatus(status: string) {
  switch (status) {
    // Mapping from checklist to Heimdall's conventions
    case 'Not_Reviewed':
      return 'Not Reviewed';
    case 'Open':
      return 'Failed';
    case 'NotAFinding':
      return 'Passed';
    case 'Not_Applicable':
      return 'Not Applicable';

    //Mapping from Heimdall's conventions back to checklist
    case 'Not Reviewed':
      return 'Not_Reviewed';
    case 'Failed':
      return 'Open';
    case 'Passed':
      return 'NotAFinding';
    case 'Not Applicable':
      return 'Not_Applicable';
    default:
      return status;
  }
}

export function mapSeverity(severity: string) {
  switch (severity) {
    // Mapping from checklist to Heimdall's conventions
    case 'CAT I':
      return 'high';
    case 'CAT II':
      return 'medium';
    case 'CAT III':
      return 'low';

    //Mapping from Heimdall's conventions back to checklist
    case 'high':
      return 'CAT I';
    case 'medium':
      return 'CAT II';
    case 'low':
      return 'CAT III';
    default:
      return severity;
  }
}

export type ChecklistAsset = {
  role: string;
  assettype: string;
  hostname: string;
  hostip: string;
  hostmac: string;
  hostfqdn: string;
  targetcomment: string;
  techarea: string;
  targetkey: string;
  webordatabase: boolean;
  webdbsite: string;
  webdbinstance: string;
};

export type ChecklistStig = {
  header: ChecklistHeader;
  vulns: ChecklistVuln[];
};

export type ChecklistHeader = {
  version: string;
  classification: string;
  customname?: string;
  stigid: string;
  description: string;
  filename: string;
  releaseinfo?: string;
  title: string;
  uuid: string;
  notice?: string;
  source?: string;
};

export type ChecklistVuln = {
  status: string;
  findingDetails: string;
  comments: string;
  severityOverride: string;
  severityJustification: string;
  vulnNum: string;
  severity: string;
  groupTitle: string;
  ruleId: string;
  ruleVersion: string;
  ruleTitle: string;
  vulnDiscuss: string;
  iaControls: string;
  checkContent: string;
  fixText: string;
  falsePositives: string;
  falseNegatives: string;
  documentable: string;
  mitigations: string;
  potentialImpact: string;
  thirdPartyTools: string;
  mitigationControl: string;
  responsibility: string;
  securityOverrideGuidance: string;
  checkContentRef: string;
  weight: string;
  class: string;
  stigRef: string;
  targetKey: string;
  stigUuid: string;
  legacyId: string;
  cciRef: string;
};
