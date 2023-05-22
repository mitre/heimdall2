import _ from 'lodash';
import {
  ChecklistJSONIX,
  ChecklistJsonixAsset,
  ChecklistJsonixIstig,
  ChecklistJsonixSiData,
  ChecklistJsonixStigData,
  ChecklistJsonixVuln
} from '../../types/checklistJsonix';
import { JsonixIntermediateConverter } from '../jsonix-intermediate-converter';

export type ChecklistObject = {
  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  jsonixData: ChecklistJSONIX;
};

type ChecklistAsset = Omit<ChecklistJsonixAsset, 'TYPE_NAME'>;

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
export type ChecklistVuln = Omit<
  ChecklistJsonixVuln,
  'TYPE_NAME' | 'stigdata' | 'status'
> & {
  status: 'Passed' | 'Failed' | 'Not Applicable' | 'Not Reviewed';
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

export class ChecklistJsonixConverter extends JsonixIntermediateConverter<ChecklistJSONIX, ChecklistObject> {

  getValueFromAttributeName<
    T extends ChecklistJsonixStigData | ChecklistJsonixSiData
  >(data: T[], tag: string): string {
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
  toIntermediateObject(jsonixData: ChecklistJSONIX): ChecklistObject {
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

    const rawStigs: ChecklistJsonixIstig[] = _.get(jsonixData, 'value.stigs.istig');
    const stigs: ChecklistStig[] = [];
    for (const stig of rawStigs) {
      const stigInfo: ChecklistJsonixSiData[] = _.get(stig, 'stiginfo.sidata');
      const header: StigHeader = {
        version: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'version'
        ),
        classification: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'classification'
        ) as unknown as StigHeader['classification'],
        customname: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'customname'
        ),
        stigid: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'stigid'
        ),
        description: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'description'
        ),
        filename: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'filename'
        ),
        releaseinfo: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'releaseinfo'
        ),
        title: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'title'
        ),
        uuid: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'uuid'
        ),
        notice: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'notice'
        ),
        source: this.getValueFromAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'source'
        )
      };

      const checklistVulns: ChecklistVuln[] = [];
      const vulns: ChecklistJsonixVuln[] = _.get(stig, 'vuln');
      for (const vuln of vulns) {
        const stigdata: ChecklistJsonixStigData[] = _.get(vuln, 'stigdata');
        const checklistVuln: ChecklistVuln = {
          status:
            StatusMapping[_.get(vuln, 'status')],
          findingdetails: _.get(vuln, 'findingdetails'),
          comments: _.get(vuln, 'comments'),
          severityoverride: _.get(vuln, 'severityoverride'),
          severityjustification: _.get(vuln, 'severityjustification'),
          vulnNum: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Vuln_Num'
          ),
          severity: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Severity'
          ) as unknown as ChecklistVuln['severity'],
          groupTitle: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Group_Title'
          ),
          ruleId: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Rule_ID'
          ),
          ruleVersion: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Rule_Ver'
          ),
          ruleTitle: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Rule_Title'
          ),
          vulnDiscuss: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Vuln_Discuss'
          ),
          iaControls: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'IA_Controls'
          ),
          checkContent:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Check_Content'
            ),
          fixText: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Fix_Text'
          ),
          falsePositives:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'False_Positives'
            ),
          falseNegatives:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'False_Negatives'
            ),
          documentable:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Documentable'
            ) as unknown as boolean,
          mitigations: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Mitigations'
          ),
          potentialImpact:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Potential_Impact'
            ),
          thirdPartyTools:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Third_Party_Tools'
            ),
          mitigationControl:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Mitigation_Control'
            ),
          responsibility:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Responsibility'
            ),
          securityOverrideGuidance:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Security_Override_Guidance'
            ),
          checkContentRef:
            this.getValueFromAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Check_Content_Ref'
            ),
          weight: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Weight'
          ),
          class: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Class'
          ) as unknown as ChecklistVuln['class'],
          stigRef: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'STIGRef'
          ),
          targetKey: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'TargetKey'
          ),
          stigUuid: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'STIG_UUID'
          ),
          legacyId: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'LEGACY_ID'
          ),
          cciRef: this.getValueFromAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'CCI_REF'
          )
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
  };
}
