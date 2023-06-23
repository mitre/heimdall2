import * as _ from 'lodash';
import {
  Asset,
  Checklist,
  Istig,
  Sidata,
  Stigdata,
  Vuln
} from '../../types/checklistJsonix';
import {JsonixIntermediateConverter} from '../jsonix-intermediate-converter';

export type ChecklistObject = {
  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  jsonixData: Checklist;
};

export type ChecklistAsset = Asset;

type ChecklistStig = {
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
export type ChecklistVuln = Omit<Vuln, 'stigdata' | 'status'> & {
  status: StatusMapping;
  vulnNum: string;
  severity: Severity;
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

// Status mapping for going to and from checklist
enum StatusMapping {
  NotAFinding = 'Passed',
  Open = 'Failed',
  Not_Applicable = 'Not Applicable',
  Not_Reviewed = 'Not Reviewed'
}

export enum Severity {
  Empty = '',
  High = 'high',
  Low = 'low',
  Medium = 'medium'
}

export class ChecklistJsonixConverter extends JsonixIntermediateConverter<
  Checklist,
  ChecklistObject
> {
  getValueFromAttributeName<T extends Stigdata | Sidata>(
    data: T[],
    tag: string
  ): string {
    let keyName = 'vulnattribute';
    let dataName = 'attributedata';
    if (data.every((o) => 'sidname' in o)) {
      keyName = 'sidname';
      dataName = 'siddata';
    }
    const results = data.filter((attribute: T) => {
      return _.get(attribute, keyName) == tag;
    });
    return results.map((result: T) => _.get(result, dataName)).join('; ');
  }

  /**
   * Creates checklist object for mapping to HDF
   * @param jsonixData - ChecklistJSONIX object
   * @returns - newChecklistObject
   */
  toIntermediateObject(jsonixData: Checklist): ChecklistObject {
    const asset: ChecklistAsset = {
      role: _.get(jsonixData, 'value.asset.role'),
      assettype: _.get(jsonixData, 'value.asset.assettype'),
      hostname: _.get(jsonixData, 'value.asset.hostname'),
      hostip: _.get(jsonixData, 'value.asset.hostip'),
      hostmac: _.get(jsonixData, 'value.asset.hostmac'),
      hostfqdn: _.get(jsonixData, 'value.asset.hostfqdn'),
      marking: _.get(jsonixData, 'value.asset.marking'),
      targetcomment: _.get(jsonixData, 'value.asset.targetcomment'),
      techarea: _.get(jsonixData, 'value.asset.techarea'),
      targetkey: _.get(jsonixData, 'value.asset.targetkey'),
      webordatabase: _.get(jsonixData, 'value.asset.webordatabase'),
      webdbsite: _.get(jsonixData, 'value.asset.webdbsite'),
      webdbinstance: _.get(jsonixData, 'value.asset.webdbinstance')
    };

    const rawStigs: Istig[] = _.get(
      jsonixData,
      'value.stigs.istig'
    ) as unknown as Istig[];
    const stigs: ChecklistStig[] = [];
    for (const stig of rawStigs) {
      const stigInfo: Sidata[] = _.get(
        stig,
        'stiginfo.sidata'
      ) as unknown as Sidata[];
      const header: StigHeader = {
        version: this.getValueFromAttributeName<Sidata>(stigInfo, 'version'),
        classification: this.getValueFromAttributeName<Sidata>(
          stigInfo,
          'classification'
        ) as unknown as StigHeader['classification'],
        customname: this.getValueFromAttributeName<Sidata>(
          stigInfo,
          'customname'
        ),
        stigid: this.getValueFromAttributeName<Sidata>(stigInfo, 'stigid'),
        description: this.getValueFromAttributeName<Sidata>(
          stigInfo,
          'description'
        ),
        filename: this.getValueFromAttributeName<Sidata>(stigInfo, 'filename'),
        releaseinfo: this.getValueFromAttributeName<Sidata>(
          stigInfo,
          'releaseinfo'
        ),
        title: this.getValueFromAttributeName<Sidata>(stigInfo, 'title'),
        uuid: this.getValueFromAttributeName<Sidata>(stigInfo, 'uuid'),
        notice: this.getValueFromAttributeName<Sidata>(stigInfo, 'notice'),
        source: this.getValueFromAttributeName<Sidata>(stigInfo, 'source')
      };

      const checklistVulns: ChecklistVuln[] = [];
      const vulns: Vuln[] = _.get(stig, 'vuln');
      for (const vuln of vulns) {
        const stigdata: Stigdata[] = _.get(vuln, 'stigdata');
        const checklistVuln: ChecklistVuln = {
          status: StatusMapping[_.get(vuln, 'status')],
          findingdetails: _.get(vuln, 'findingdetails'),
          comments: _.get(vuln, 'comments'),
          severityoverride: _.get(vuln, 'severityoverride'),
          severityjustification: _.get(vuln, 'severityjustification'),
          vulnNum: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Vuln_Num'
          ),
          severity: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Severity'
          ) as unknown as ChecklistVuln['severity'],
          groupTitle: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Group_Title'
          ),
          ruleId: this.getValueFromAttributeName<Stigdata>(stigdata, 'Rule_ID'),
          ruleVersion: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Rule_Ver'
          ),
          ruleTitle: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Rule_Title'
          ),
          vulnDiscuss: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Vuln_Discuss'
          ),
          iaControls: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'IA_Controls'
          ),
          checkContent: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Check_Content'
          ),
          fixText: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Fix_Text'
          ),
          falsePositives: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'False_Positives'
          ),
          falseNegatives: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'False_Negatives'
          ),
          documentable: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Documentable'
          ) as unknown as boolean,
          mitigations: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Mitigations'
          ),
          potentialImpact: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Potential_Impact'
          ),
          thirdPartyTools: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Third_Party_Tools'
          ),
          mitigationControl: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Mitigation_Control'
          ),
          responsibility: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Responsibility'
          ),
          securityOverrideGuidance: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Security_Override_Guidance'
          ),
          checkContentRef: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Check_Content_Ref'
          ),
          weight: this.getValueFromAttributeName<Stigdata>(stigdata, 'Weight'),
          class: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Class'
          ) as unknown as ChecklistVuln['class'],
          stigRef: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'STIGRef'
          ),
          targetKey: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'TargetKey'
          ),
          stigUuid: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'STIG_UUID'
          ),
          legacyId: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'LEGACY_ID'
          ),
          cciRef: this.getValueFromAttributeName<Stigdata>(stigdata, 'CCI_REF')
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
      jsonixData: jsonixData
    };
    return checklistObject;
  }
}
