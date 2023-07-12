import {ExecJSON} from 'inspecjs';
import {ControlResultStatus} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import {
  Asset,
  Assettype,
  Checklist,
  Istig,
  LocalPartEnum,
  Name,
  Role,
  Severityoverride,
  Sidata,
  Sidname,
  Status,
  Stigdata,
  StigdatumElement,
  Techarea,
  Vuln,
  Vulnattribute
} from '../../types/checklistJsonix';
import {JsonixIntermediateConverter} from '../jsonix-intermediate-converter';
import {getDescription} from '../utils/global';

export type ChecklistObject = {
  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  jsonixData?: Checklist;
};

type ChecklistAsset = Asset;

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
  Not_Reviewed = 'Not Reviewed',
  Passed = 'NotAFinding',
  Failed = 'Open',
  Error = 'Not_Reviewed',
  SkippedImpactEqZero = 'Not_Applicable',
  SkippedImpactGtZero = 'Not_Reviewed',
  Default = 'Not_Reviewed'
}

export enum Severity {
  Empty = '',
  High = 'high',
  Low = 'low',
  Medium = 'medium'
}

export const EmptyChecklistObject: ChecklistObject = {
  asset: {
    assettype: 'Computing',
    hostfqdn: null,
    hostip: null,
    hostmac: null,
    hostname: null,
    role: 'None',
    targetkey: null,
    techarea: '',
    webdbinstance: null,
    webdbsite: null,
    webordatabase: null
  },
  stigs: [
    {
      header: {
        version: '',
        classification: 'UNCLASSIFIED',
        stigid: '',
        description: '',
        filename: '',
        title: '',
        uuid: ''
      },
      vulns: [
        {
          status: StatusMapping.Not_Reviewed,
          vulnNum: '',
          severity: Severity.Low,
          groupTitle: '',
          ruleId: '',
          ruleVersion: '',
          ruleTitle: '',
          vulnDiscuss: '',
          iaControls: '',
          checkContent: '',
          fixText: '',
          falsePositives: '',
          falseNegatives: '',
          documentable: false,
          mitigations: '',
          potentialImpact: '',
          thirdPartyTools: '',
          mitigationControl: '',
          responsibility: '',
          securityOverrideGuidance: '',
          checkContentRef: '',
          weight: '',
          class: 'Unclass',
          stigRef: '',
          targetKey: '',
          stigUuid: '',
          legacyId: '',
          cciRef: '',
          comments: null,
          findingdetails: null,
          severityjustification: null,
          severityoverride: Severityoverride.Empty
        }
      ]
    }
  ]
};

/**
 * Checklist jsonix converter
 */
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

  flattenHeader(header: StigHeader): Sidata[] {
    const sidata: Sidata[] = [];
    for (const [name, data] of Object.entries(header)) {
      sidata.push({
        sidname: name as Sidname,
        siddata: data
      });
    }
    return sidata;
  }

  flattenVulns(checklistVulns: ChecklistVuln[]): Vuln[] {
    const vulns: Vuln[] = [];
    for (const checklistVuln of checklistVulns) {
      const stigdata: StigdatumElement[] = [];
      for (const [attributeName, data] of Object.entries(checklistVuln)) {
        if (attributeName in Vulnattribute) {
          stigdata.push({
            vulnattribute: attributeName as Vulnattribute,
            attributedata: data as string
          });
        }
      }
      const vuln: Vuln = {
        comments: checklistVuln.comments,
        findingdetails: checklistVuln.findingdetails,
        severityjustification: checklistVuln.severityjustification,
        severityoverride: checklistVuln.severityoverride,
        status: Object.keys(StatusMapping)[
          Object.values(StatusMapping).indexOf(checklistVuln.status)
        ] as Status,
        stigdata: stigdata
      };
      vulns.push(vuln);
    }
    return vulns;
  }

  fromIntermediateObject(intermediateObj: ChecklistObject): Checklist {
    const name: Name = {
      localPart: LocalPartEnum.Checklist
    };
    const istigs: Istig[] = [];
    for (const stig of intermediateObj.stigs) {
      const istig: Istig = {
        stiginfo: {
          sidata: this.flattenHeader(stig.header)
        },
        vuln: this.flattenVulns(stig.vulns)
      };
      istigs.push(istig);
    }
    const value: Stigdata = {
      asset: {...intermediateObj.asset},
      stigs: {
        istig: istigs
      }
    };
    const checklist: Checklist = {
      name: name,
      value: value
    };

    return checklist;
  }

  getStatus(results: ExecJSON.ControlResult[], impact: number): StatusMapping {
    const statuses: ControlResultStatus[] = results.map((result) => {
      return result.status;
    }) as unknown as ControlResultStatus[];
    const allPassed = (status: ControlResultStatus) =>
      status === ControlResultStatus.Passed;

    if (statuses.every(allPassed)) {
      return StatusMapping.Passed;
    } else if (statuses.includes(ControlResultStatus.Failed)) {
      return StatusMapping.Failed;
    } else if (statuses.includes(ControlResultStatus.Error)) {
      return StatusMapping.Error;
    } else if (statuses.includes(ControlResultStatus.Skipped)) {
      if (impact === 0) {
        return StatusMapping.SkippedImpactEqZero;
      } else {
        return StatusMapping.SkippedImpactGtZero;
      }
    } else {
      return StatusMapping.Default;
    }
  }

  severityMap(impact: number): Severity {
    if (impact < 0.4) {
      return Severity.Low;
    } else if (impact < 0.7) {
      return Severity.Medium;
    } else {
      return Severity.High;
    }
  }

  getDescriptions(
    descriptions: ExecJSON.ControlDescription[],
    label: string
  ): string {
    for (const description of descriptions) {
      if (description.label === label) {
        return description.data;
      }
    }
    throw new Error(
      `Unable to match description label "${label}" within descriptions.`
    );
  }

  hdfToIntermediateObject(hdf: ExecJSON.Execution): ChecklistObject {
    const stigs: ChecklistStig[] = [];
    const vulns: ChecklistVuln[] = [];
    for (const profile of hdf.profiles) {
      // if profile is overlay or parent profile, skip
      if (!profile.depends?.length) {
        continue;
      }
      const header: StigHeader = {
        version: profile.version as string,
        classification: 'UNCLASSIFIED',
        customname: '',
        stigid: '',
        description: profile.description as string,
        filename: '',
        releaseinfo: '',
        title: profile.title as string,
        uuid: '',
        notice: profile.license as string,
        source: 'STIG.DOD.MIL'
      };
      for (const control of profile.controls) {
        const vuln: ChecklistVuln = {
          status: this.getStatus(control.results, control.impact),
          vulnNum: control.id,
          severity: this.severityMap(control.impact),
          groupTitle: control.tags.gtitle ?? '',
          ruleId: control.tags.rid ?? '',
          ruleVersion: control.tags.stig_id ?? '',
          ruleTitle: control.title ?? '',
          vulnDiscuss: control.desc ?? '',
          iaControls: control.tags.IA_Controls ?? '',
          checkContent: getDescription(
            control.descriptions as ExecJSON.ControlDescription[],
            'check'
          ) as string,
          fixText: getDescription(
            control.descriptions as ExecJSON.ControlDescription[],
            'fix'
          ) as string,
          falsePositives: control.tags.False_Positives ?? '',
          falseNegatives: control.tags.False_Negatives ?? '',
          documentable: false,
          mitigations: control.tags.Mitigations ?? '',
          potentialImpact: control.tags.Potential_Impact ?? '',
          thirdPartyTools: '',
          mitigationControl: control.tags.Mitigation_Control ?? '',
          responsibility: control.tags.Responsibility ?? '',
          securityOverrideGuidance:
            control.tags.Security_Override_Guidance ?? '',
          checkContentRef: 'M',
          weight: control.tags.weight ?? '10.0', // default found on checklists svaed from stigviewer has always been 10.0
          class: 'Unclass',
          stigRef: control.tags.STIGRef ?? '',
          targetKey: '',
          stigUuid: '',
          legacyId: control.tags.Legacy_ID ?? '',
          cciRef: '', //this.getCciRefs(control.)'',
          comments: null,
          findingdetails: null,
          severityjustification: null,
          severityoverride: Severityoverride.Empty
        };
        vulns.push(vuln);
      }
      stigs.push({header, vulns});
    }
    const checklistObject: ChecklistObject = {
      asset: {
        assettype:
          _.get(hdf, 'passthrough.checklist.asset.assettype') ||
          Assettype.Computing,
        hostfqdn: _.get(hdf, 'passthrough.checklist.asset.hostfqdn'),
        hostguid: _.get(hdf, 'passthrough.checklist.asset.hostguid'),
        hostip: _.get(hdf, 'passthrough.checklist.asset.hostip'),
        hostmac: _.get(hdf, 'passthrough.checklist.asset.hostmac'),
        hostname: _.get(hdf, 'passthrough.checklist.asset.hostname'),
        marking: _.get(hdf, 'passthrough.checklist.asset.marking') || 'CUI',
        role: _.get(hdf, 'passthrough.checklist.asset.role') || Role.None,
        stigguid: null,
        targetcomment: _.get(hdf, 'passthrough.checklist.asset.targetcomment'),
        targetkey: null,
        techarea:
          _.get(hdf, 'passthrough.checklist.asset.techarea') || Techarea.Empty,
        webdbinstance: _.get(hdf, 'passthrough.checklist.asset.webdbinstance'),
        webdbsite: _.get(hdf, 'passthrough.checklist.asset.webdbsite'),
        webordatabase:
          (_.get(
            hdf,
            'passthrough.checklist.asset.webordatabase'
          ) as unknown as boolean) || false
      },
      stigs: stigs
    };
    return checklistObject;
  }
}
