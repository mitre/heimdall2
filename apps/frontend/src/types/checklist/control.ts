import { FileID } from "@/store/report_intake";

export type Checklist = {
  uniqueId: FileID;
  header: ChecklistHeader;
  vulns: ChecklistVuln[];
};

export type ChecklistHeader = {
  version: number;
  classification: 'UNCLASSIFIED' | 'CLASSIFIED' | 'MORE..';
  stigid: 'string';
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
  vulnNum: string;
  severity: string;
  groupTitle: string;
  ruleId: string;
  ruleVersion: string;
  ruleTitle: string;
  vulnDiscussion: string;
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
  stigRef: string;
  // Others not included, but can be added if needed
};
