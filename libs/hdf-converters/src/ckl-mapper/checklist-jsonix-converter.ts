import _ from 'lodash';
import {
  ChecklistJSONIX,
  ChecklistJsonixAsset,
  ChecklistJsonixIstig,
  ChecklistJsonixSiData,
  ChecklistJsonixStigData,
  ChecklistJsonixVuln
} from '../../types/checklistJsonix';
import {JsonixConverter} from '../jsonix-converter';

export type ChecklistObject = {
  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  raw: ChecklistJSONIX;
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

export class ChecklistJsonixConverter extends JsonixConverter<
  ChecklistJSONIX,
  ChecklistObject
> {
  getValueFromfAttributeName<
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
    console.log('inside value getter');
    return results.map((result: T) => _.get(result, dataName)).join('; ');
  }

  /**
   * Creates checklist object for mapping to HDF
   * @param raw - ChecklistJSONIX object
   * @returns - newChecklistObject
   */
  toIntermediateObject(raw: ChecklistJSONIX): ChecklistObject {
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
      const stigInfo: ChecklistJsonixSiData[] = _.get(stig, 'stiginfo.sidata');
      const header: StigHeader = {
        version: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'version'
        ),
        classification: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'classification'
        ) as unknown as StigHeader['classification'],
        customname: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'customname'
        ),
        stigid: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'stigid'
        ),
        description: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'description'
        ),
        filename: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'filename'
        ),
        releaseinfo: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'releaseinfo'
        ),
        title: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'title'
        ),
        uuid: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'uuid'
        ),
        notice: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
          stigInfo,
          'notice'
        ),
        source: this.getValueFromfAttributeName<ChecklistJsonixSiData>(
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
            StatusMapping[_.get(vuln, 'status') as keyof typeof StatusMapping],
          findingdetails: _.get(vuln, 'findingdetails'),
          comments: _.get(vuln, 'comments'),
          severityoverride: _.get(vuln, 'severityoverride'),
          severityjustification: _.get(vuln, 'severityjustification'),
          vulnNum: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Vuln_Num'
          ),
          severity: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Severity'
          ) as unknown as ChecklistVuln['severity'],
          groupTitle: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Group_Title'
          ),
          ruleId: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Rule_ID'
          ),
          ruleVersion: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Rule_Ver'
          ),
          ruleTitle: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Rule_Title'
          ),
          vulnDiscuss: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Vuln_Discuss'
          ),
          iaControls: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'IA_Controls'
          ),
          checkContent:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Check_Content'
            ),
          fixText: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Fix_Text'
          ),
          falsePositives:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'False_Positives'
            ),
          falseNegatives:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'False_Negatives'
            ),
          documentable:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Documentable'
            ) as unknown as boolean,
          mitigations: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Mitigations'
          ),
          potentialImpact:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Potential_Impact'
            ),
          thirdPartyTools:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Third_Party_Tools'
            ),
          mitigationControl:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Mitigation_Control'
            ),
          responsibility:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Responsibility'
            ),
          securityOverrideGuidance:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Security_Override_Guidance'
            ),
          checkContentRef:
            this.getValueFromfAttributeName<ChecklistJsonixStigData>(
              stigdata,
              'Check_Content_Ref'
            ),
          weight: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Weight'
          ),
          class: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'Class'
          ) as unknown as ChecklistVuln['class'],
          stigRef: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'STIGRef'
          ),
          targetKey: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'TargetKey'
          ),
          stigUuid: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'STIG_UUID'
          ),
          legacyId: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
            stigdata,
            'LEGACY_ID'
          ),
          cciRef: this.getValueFromfAttributeName<ChecklistJsonixStigData>(
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
      raw: raw
    };

    return checklistObject;
  }
}
