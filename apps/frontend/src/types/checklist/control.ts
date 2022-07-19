import { FileID } from "@/store/report_intake";

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

  stigs: Stig[];
  raw: unknown;
};

export type Stig = {
  header: ChecklistHeader;
  vulns: ChecklistVuln[];
}

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
