import _ from 'lodash';
import {
  ChecklistJSONIX,
  ChecklistJsonixAsset,
  ChecklistJsonixIstig,
  ChecklistJsonixSidata,
  ChecklistJsonixStigData,
  ChecklistJsonixVuln
} from '../../types/checklistJsonix';

export type ChecklistObject = {
  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  raw: ChecklistJSONIX;
};

type ChecklistAsset = Omit<ChecklistJsonixAsset, 'TYPE_NAME'>;

export type ChecklistStig = {
  header: StigHeader;
  vulns: ChecklistVuln[];
};

type StigHeader = {
  version: string;
  classification:
    | 'UNCLASSIFIED'
    | 'UNCLASSIFIED//FOR OFFICIAL USE ONLY'
    | 'CUI';
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

// omit status to overwrite possible HDF status values
export type ChecklistVuln = Omit<
  ChecklistJsonixVuln,
  'TYPE_NAME' | 'stigdata' | 'status'
> & {
  status: 'Passed' | 'Failed' | 'Not Applicable' | 'Not Reviewed';
  vulnNum: string;
  severity: 'low' | 'medium' | 'high';
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
  documentable: boolean;
  mitigations: string;
  potentialImpact: string;
  thirdPartyTools: string;
  mitigationControl: string;
  responsibility: string;
  securityOverrideGuidance: string;
  checkContentRef: string;
  weight: string;
  class: 'Unclass' | 'FOUO' | 'CUI';
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
export function getAttributeData(
  stigdata: ChecklistJsonixStigData[],
  tag: string
): string {
  const results = stigdata.filter((attribute: ChecklistJsonixStigData) => {
    return _.get(attribute, 'vulnattribute') === tag;
  });
  return results
    .map((result: ChecklistJsonixStigData) => _.get(result, 'attributedata'))
    .join('; ');
}

/**
 * Gets si data
 * @param stiginfo - array of raw stig information json
 * @param tag - attribute name
 * @returns si data
 */
export function getSiData(
  stiginfo: ChecklistJsonixSidata[],
  tag: string
): string {
  const results = stiginfo.filter((attribute: ChecklistJsonixSidata) => {
    return _.get(attribute, 'sidname') === tag;
  });
  return results
    .map((result: ChecklistJsonixSidata) => _.get(result, 'siddata'))
    .join('; ');
}

// Status mapping for going to and from checklist
enum StatusMapping {
  NotAFinding = 'Passed',
  Open = 'Failed',
  Not_Applicable = 'Not Applicable',
  Not_Reviewed = 'Not Reviewed'
}

/**
 * Creates checklist object for mapping to HDF
 * @param raw - ChecklistJSONIX object
 * @returns - newChecklistObject
 */
export function createChecklistObject(raw: ChecklistJSONIX): ChecklistObject {
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

  const rawStigs: ChecklistJsonixIstig[] = _.get(raw, 'value.stigs.istig');
  const stigs: ChecklistStig[] = [];
  for (const stig of rawStigs) {
    const stigInfo: ChecklistJsonixSidata[] = _.get(stig, 'stiginfo.sidata');
    const header: StigHeader = {
      version: getSiData(stigInfo, 'version'),
      classification: getSiData(
        stigInfo,
        'classification'
      ) as unknown as StigHeader['classification'],
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
    const vulns: ChecklistJsonixVuln[] = _.get(stig, 'vuln');
    for (const vuln of vulns) {
      const stigdata: ChecklistJsonixStigData[] = _.get(vuln, 'stigdata');
      const checklistVuln: ChecklistVuln = {
        status:
          StatusMapping[_.get(vuln, 'status') as keyof typeof StatusMapping],
        findingdetails: _.get(vuln, 'findingdetails'),
        comments: _.get(vuln, 'comments'),
        severityoverride: _.get(vuln, 'severityoverride'),
        severityjustification: _.get(vuln, 'severityjustification'),
        vulnNum: getAttributeData(stigdata, 'Vuln_Num'),
        severity: getAttributeData(
          stigdata,
          'Severity'
        ) as unknown as ChecklistVuln['severity'],
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
        documentable: getAttributeData(
          stigdata,
          'Documentable'
        ) as unknown as boolean,
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
        class: getAttributeData(
          stigdata,
          'Class'
        ) as unknown as ChecklistVuln['class'],
        stigRef: getAttributeData(stigdata, 'STIGRef'),
        targetKey: getAttributeData(stigdata, 'TargetKey'),
        stigUuid: getAttributeData(stigdata, 'STIG_UUID'),
        legacyId: getAttributeData(stigdata, 'LEGACY_ID'),
        cciRef: getAttributeData(stigdata, 'CCI_REF')
      };
      checklistVulns.push(checklistVuln);
    }

    stigs.push({
      header: header,
      vulns: checklistVulns
    });
  }

  const checklistObject: ChecklistObject = {
    asset: asset,
    stigs: stigs,
    raw: raw
  };

  return checklistObject;
}
