import _ from 'lodash';

export type ChecklistFile = {
  /**
   * Unique identifier for this file. Used to encode which file is currently selected, etc.
   *
   * Note that in general one can assume that if a file A is loaded AFTER a file B, then
   * A.unique_id > B.unique_id.
   * Using this property, one might order files by order in which they were added.
   */
  uniqueId: string;
  /** The filename that this file was uploaded under. */
  filename: string;

  database_id?: string;

  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  raw: Record<string, unknown>;
};

type ChecklistAsset = {
  role: string;
  assettype: string;
  hostname: string;
  hostip: string;
  hostmac: string;
  hostfqdn: string;
  marking: string;
  targetcomment: string;
  techarea: string;
  targetkey: string;
  webordatabase: boolean;
  webdbsite: string;
  webdbinstance: string;
};

type ChecklistStig = {
  header: StigHeader;
  vulns: ChecklistVuln[];
};

type StigHeader = {
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

type ChecklistVuln = {
  status: string | undefined; // Look into alternate way of mapping.  Shouldn't be undefined
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

/**
 * Gets attribute data
 * @param stigdata - array of raw stig data json
 * @param tag - attribute name
 * @returns attribute data
 */
function getAttributeData(stigdata: unknown[], tag: string): string {
  const results = stigdata.filter((attribute: unknown) => {
    return _.get(attribute, 'vulnattribute') === tag;
  });
  if (results.length === 1) {
    return _.get(results[0], 'attributedata');
  } else {
    return results
      .map((result: unknown) => _.get(result, 'attributedata'))
      .join('; ');
  }
}

/**
 * Gets si data
 * @param stiginfo - array of raw stig information json
 * @param tag - attribute name
 * @returns si data
 */
function getSiData(stiginfo: unknown[], tag: string): string {
  const results = stiginfo.filter((attribute: unknown) => {
    return _.get(attribute, 'sidname') === tag;
  });
  if (results.length === 1) {
    return _.get(results[0], 'siddata');
  } else {
    return results
      .map((result: unknown) => _.get(result, 'siddata'))
      .join('; ');
  }
}

// Status mapping for going to and from checklist
const STATUS_MAPPING: Map<string | undefined, string> = new Map([
  ['NotAFinding', 'Passed'],
  ['Open', 'Failed'],
  ['Not_Applicable', 'Not Applicable'],
  ['Not_Reviewed', 'Not Reviewed'],
  ['Passed', 'NotAFinding'],
  ['Failed', 'Open'],
  ['Not Applicable', 'Not_Applicable'],
  ['Not Reviewed', 'Not_Reviewed']
]);

/**
 * Creates checklist object
 * @param raw
 * @returns - newChecklistObject
 */
export function createChecklistObject(raw: Record<string, any>) {
  const asset: ChecklistAsset = {
    role: _.get(raw, 'value.asset.role'),
    assettype: _.get(raw, 'value.asset.assettype'),
    hostname: _.get(raw, 'value.asset.hostname'),
    hostip: _.get(raw, 'value.asset.hostip'),
    hostmac: _.get(raw, 'value.asset.hostmac'),
    hostfqdn: _.get(raw, 'value.asset.hostfqdn'),
    marking: _.get(raw, 'value.asset.marking'),
    targetcomment: _.get(raw, 'value.asset.targetcomment'),
    techarea: _.get(raw, 'value.asset.techarea'),
    targetkey: _.get(raw, 'value.asset.targetkey'),
    webordatabase: _.get(raw, 'value.asset.webordatabase'),
    webdbsite: _.get(raw, 'value.asset.webdbsite'),
    webdbinstance: _.get(raw, 'value.asset.webdbinstance')
  };

  const rawStigs: unknown[] = _.get(raw, 'value.stigs.istig');
  const stigs: ChecklistStig[] = [];

  rawStigs.forEach((stig: unknown) => {
    const stigInfo = _.get(stig, 'stiginfo.sidata');
    const header: StigHeader = {
      version: getSiData(stigInfo, 'version'),
      classification: getSiData(stigInfo, 'classification'),
      customname: getSiData(stigInfo, 'customname'),
      stigid: getSiData(stigInfo, 'stigid'),
      description: getSiData(stigInfo, 'description'),
      filename: getSiData(stigInfo, 'filename'),
      releaseinfo: getSiData(stigInfo, 'releaseinfo'),
      title: getSiData(stigInfo, 'title'),
      uuid: getSiData(stigInfo, 'uuid'),
      notice: getSiData(stigInfo, 'notice'),
      source: getSiData(stigInfo, 'source')
    };

    const checklistVulns: ChecklistVuln[] = [];
    const vulns: unknown[] = _.get(stig, 'vuln');
    vulns.forEach((vuln: unknown) => {
      const stigdata: unknown[] = _.get(vuln, 'stigdata');
      const checklistVuln: ChecklistVuln = {
        status: STATUS_MAPPING.get(_.get(vuln, 'status')),
        findingDetails: _.get(vuln, 'findingdetails'),
        comments: _.get(vuln, 'comments'),
        severityOverride: _.get(vuln, 'severityoverride'),
        severityJustification: _.get(vuln, 'severityjustification'),
        vulnNum: getAttributeData(stigdata, 'Vuln_Num'),
        severity: getAttributeData(stigdata, 'Severity'),
        groupTitle: getAttributeData(stigdata, 'Group_Title'),
        ruleId: getAttributeData(stigdata, 'Rule_ID'),
        ruleVersion: getAttributeData(stigdata, 'Rule_Ver'),
        ruleTitle: getAttributeData(stigdata, 'Rule_Title'),
        vulnDiscuss: getAttributeData(stigdata, 'Vuln_Discuss'),
        iaControls: getAttributeData(stigdata, 'IA_Controls'),
        checkContent: getAttributeData(stigdata, 'Check_Content'),
        fixText: getAttributeData(stigdata, 'Fix_Text'),
        falsePositives: getAttributeData(stigdata, 'False_Positives'),
        falseNegatives: getAttributeData(stigdata, 'False_Negatives'),
        documentable: getAttributeData(stigdata, 'Documentable'),
        mitigations: getAttributeData(stigdata, 'Mitigations'),
        potentialImpact: getAttributeData(stigdata, 'Potential_Impact'),
        thirdPartyTools: getAttributeData(stigdata, 'Third_Party_Tools'),
        mitigationControl: getAttributeData(stigdata, 'Mitigation_Control'),
        responsibility: getAttributeData(stigdata, 'Responsibility'),
        securityOverrideGuidance: getAttributeData(
          stigdata,
          'Security_Override_Guidance'
        ),
        checkContentRef: getAttributeData(stigdata, 'Check_Content_Ref'),
        weight: getAttributeData(stigdata, 'Weight'),
        class: getAttributeData(stigdata, 'Class'),
        stigRef: getAttributeData(stigdata, 'STIGRef'),
        targetKey: getAttributeData(stigdata, 'TargetKey'),
        stigUuid: getAttributeData(stigdata, 'STIG_UUID'),
        legacyId: getAttributeData(stigdata, 'LEGACY_ID'),
        cciRef: getAttributeData(stigdata, 'CCI_REF')
      };
      checklistVulns.push(checklistVuln);
    });

    stigs.push({
      header: header,
      vulns: checklistVulns
    });
  });

  const newChecklist: Omit<ChecklistFile, 'uniqueId'> = {
    filename: stigs[0].header.filename,
    asset: asset,
    stigs: stigs,
    raw: raw
  };

  return newChecklist;
}
