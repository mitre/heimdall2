import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {JsonixIntermediateConverter} from '../jsonix-intermediate-converter';
import {CciNistTwoWayMapper} from '../mappings/CciNistMapping';
import {getDescription} from '../utils/global';
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
} from './checklistJsonix';
import {coerce} from 'semver';
import {validateProfileMetadata} from './checklist-mapper';

export type ChecklistObject = {
  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  jsonixData?: Checklist;
};

type ChecklistAsset = Asset;

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
export type ChecklistVuln = Omit<Vuln, 'stigdata' | 'status'> & {
  status: StatusMapping;
  vulnNum: string;
  severity: Severity;
  groupTitle: string;
  ruleId: string;
  ruleVer: string;
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

export type ChecklistMetadata = {
  marking: string;
  hostname: string;
  hostip: string;
  hostmac: string;
  hostfqdn: string;
  targetcomment: string;
  role: Role;
  assettype: Assettype;
  techarea: Techarea;
  webordatabase: string;
  webdbsite: string;
  webdbinstance: string;
  vulidmapping: 'id' | 'gid';
  profiles: StigMetadata[];
};

export type StigMetadata = {
  name: string;
  title: string;
  releasenumber: number;
  version: number;
  releasedate: string;
  showCalendar: boolean;
};

export const EmptyChecklistObject: ChecklistObject = {
  asset: {
    assettype: Assettype.Computing,
    marking: 'CUI',
    hostfqdn: null,
    hostip: null,
    hostmac: null,
    hostname: null,
    targetcomment: null,
    role: Role.None,
    targetkey: null,
    techarea: Techarea.Empty,
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
          ruleVer: '',
          ruleTitle: '',
          vulnDiscuss: '',
          iaControls: '',
          checkContent: '',
          fixText: '',
          falsePositives: '',
          falseNegatives: '',
          documentable: 'false',
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

export function updateChecklistWithMetadata(
  file: ExecJSON.Execution
): ChecklistObject {
  const metadata: ChecklistMetadata = _.get(
    file,
    'passthrough.metadata'
  ) as unknown as ChecklistMetadata;
  const checklist: ChecklistObject = _.get(
    file,
    'passthrough.checklist'
  ) as unknown as ChecklistObject;
  checklist.asset.assettype = metadata.assettype;
  checklist.asset.marking = metadata.marking;
  checklist.asset.hostfqdn = metadata.hostfqdn;
  checklist.asset.hostip = metadata.hostip;
  checklist.asset.hostname = metadata.hostname;
  checklist.asset.hostmac = metadata.hostmac;
  checklist.asset.targetcomment = metadata.targetcomment;
  checklist.asset.role = metadata.role;
  checklist.asset.techarea = metadata.techarea;
  checklist.asset.webordatabase = [true, 'true'].includes(
    metadata.webordatabase
  );
  checklist.asset.webdbsite = metadata.webdbsite;
  checklist.asset.webdbinstance = metadata.webdbinstance;

  for (const stig of checklist.stigs) {
    for (const profile of metadata.profiles) {
      if (stig.header.title === profile.name) {
        stig.header.title = profile.title || profile.name;
        stig.header.version = profile.version.toString();
        stig.header.releaseinfo = `Release: ${profile.releasenumber} Benchmark Date: ${profile.releasedate}`;
        for (const vuln of stig.vulns) {
          vuln.stigRef = `${stig.header.title} :: Version ${stig.header.version}, ${stig.header.releaseinfo}`;
        }
      }
    }
  }

  return checklist;
}

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
      role: _.get(jsonixData, 'value.asset.role') as unknown as Role,
      assettype: _.get(
        jsonixData,
        'value.asset.assettype'
      ) as unknown as Assettype,
      hostname: _.get(jsonixData, 'value.asset.hostname') as unknown as string,
      hostip: _.get(jsonixData, 'value.asset.hostip') as unknown as string,
      hostmac: _.get(jsonixData, 'value.asset.hostmac') as unknown as string,
      hostfqdn: _.get(jsonixData, 'value.asset.hostfqdn') as unknown as string,
      marking: _.get(jsonixData, 'value.asset.marking') as unknown as string,
      targetcomment: _.get(
        jsonixData,
        'value.asset.targetcomment'
      ) as unknown as string,
      techarea: _.get(
        jsonixData,
        'value.asset.techarea'
      ) as unknown as Techarea,
      targetkey: _.get(
        jsonixData,
        'value.asset.targetkey'
      ) as unknown as string,
      webordatabase: [true, 'true'].includes(
        _.get(jsonixData, 'value.asset.webordatabase', false) as
          | string
          | boolean
      ),
      webdbsite: _.get(
        jsonixData,
        'value.asset.webdbsite'
      ) as unknown as string,
      webdbinstance: _.get(
        jsonixData,
        'value.asset.webdbinstance'
      ) as unknown as string
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
          ruleVer: this.getValueFromAttributeName<Stigdata>(
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
          ) as unknown as string,
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

  expandHeader(header: StigHeader): Sidata[] {
    const sidata: Sidata[] = [];
    for (const [name, data] of Object.entries(header)) {
      if (data) {
        sidata.push({
          sidname: name as Sidname,
          siddata: data
        });
      } else {
        sidata.push({sidname: name as Sidname});
      }
    }
    return sidata;
  }

  expandVulns(checklistVuln: ChecklistVuln): StigdatumElement[] {
    const separateElementNames: string[] = ['CciRef', 'IAControls', 'LegacyID'];
    const stigdata: StigdatumElement[] = [];
    for (const [attributeName, data] of Object.entries(checklistVuln)) {
      const keyFoundInVulnattribute: string | undefined = Object.keys(
        Vulnattribute
      ).find((key) => key.toLowerCase() === attributeName.toLowerCase());
      if (keyFoundInVulnattribute) {
        if (separateElementNames.includes(keyFoundInVulnattribute)) {
          const dataStrings = data?.toString().split(/[,|;]/) ?? [];
          for (const dataString of dataStrings) {
            stigdata.push({
              vulnattribute:
                Vulnattribute[
                  keyFoundInVulnattribute as keyof typeof Vulnattribute
                ],
              attributedata: dataString.trim()
            });
          }
          continue;
        }
        stigdata.push({
          vulnattribute:
            Vulnattribute[
              keyFoundInVulnattribute as keyof typeof Vulnattribute
            ],
          attributedata: data as string
        });
      }
    }
    return stigdata;
  }

  createVulns(checklistVulns: ChecklistVuln[]): Vuln[] {
    const vulns: Vuln[] = [];
    for (const checklistVuln of checklistVulns) {
      const stigdata: StigdatumElement[] = this.expandVulns(checklistVuln);
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
          sidata: this.expandHeader(stig.header)
        },
        vuln: this.createVulns(stig.vulns)
      };
      istigs.push(istig);
    }
    const value: Stigdata = {
      asset: {
        ...intermediateObj.asset
      },
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
    const statuses: ExecJSON.ControlResultStatus[] = results.map((result) => {
      return result.status;
    }) as unknown as ExecJSON.ControlResultStatus[];
    if (impact === 0) {
      return StatusMapping.Not_Applicable;
    } else if (statuses.includes(ExecJSON.ControlResultStatus.Failed)) {
      return StatusMapping.Open;
    } else if (statuses.includes(ExecJSON.ControlResultStatus.Passed)) {
      return StatusMapping.NotAFinding;
    } else {
      return StatusMapping.Not_Reviewed;
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

  getFindingDetails(results: ExecJSON.ControlResult[]): string {
    if (typeof results === 'undefined') {
      return '';
    } else {
      return results
        .map((result) => {
          if (result.message) {
            return `${result.status} :: TEST ${result.code_desc} :: MESSAGE ${result.message}`;
          } else if (result.skip_message) {
            return `${result.status} :: TEST ${result.code_desc} :: SKIP_MESSAGE ${result.skip_message}`;
          } else {
            return `${result.status} :: TEST ${result.code_desc}`;
          }
        })
        .join('\n--------------------------------\n');
    }
  }

  matchNistToCcis(nistRefs: string[]): string[] {
    if (!nistRefs) {
      return [''];
    }
    const CCI_NIST_TWO_WAY_MAPPER = new CciNistTwoWayMapper();
    return CCI_NIST_TWO_WAY_MAPPER.cciFilter(nistRefs, ['']);
  }

  getComments(descriptions: ExecJSON.ControlDescription[]): string {
    let results = '';
    const caveat = getDescription(descriptions, 'caveat');
    const justification = getDescription(descriptions, 'justification');
    const rationale = getDescription(descriptions, 'rationale');
    const comments = getDescription(descriptions, 'comments');
    if (caveat) {
      results += `CAVEAT :: ${caveat}\n`;
    }
    if (justification) {
      results += `JUSTIFICATION :: ${justification}\n`;
    }
    if (rationale) {
      results += `RATIONALE :: ${rationale}\n`;
    }
    if (comments) {
      results += `COMMENTS :: ${comments}`;
    }
    return results;
  }

  addHdfControlSpecificData(control: ExecJSON.Control): string {
    const hdfSpecificData: Record<string, unknown> = {};
    const checklistImpactNumbers = [0.7, 0.5, 0.3, 0];
    if (!checklistImpactNumbers.includes(control.impact)) {
      hdfSpecificData['impact'] = control.impact;
    }
    if (control.code?.startsWith('control')) {
      hdfSpecificData['code'] = control.code;
    }

    const hdfDataExist = Object.keys(hdfSpecificData).length !== 0;

    return hdfDataExist
      ? JSON.stringify({hdfSpecificData: hdfSpecificData}, null, 2)
      : '';
  }

  addHdfProfileSpecificData(profile: ExecJSON.Profile): string {
    const hdfSpecificData: Record<string, unknown> = {};
    if (profile.attributes.length) {
      hdfSpecificData['attributes'] = profile.attributes;
    }
    if (profile.copyright) {
      hdfSpecificData['copyright'] = profile.copyright;
    }
    if (profile.copyright_email) {
      hdfSpecificData['copyright_email'] = profile.copyright_email;
    }
    if (profile.maintainer) {
      hdfSpecificData['maintainer'] = profile.maintainer;
    }
    if (profile.version) {
      hdfSpecificData['version'] = profile.version;
    }

    const hdfDataExist = Object.keys(hdfSpecificData).length !== 0;
    return hdfDataExist ? JSON.stringify({hdfSpecificData}) : '';
  }

  controlsToVulns(
    profile: ExecJSON.Profile,
    stigRef: string,
    metadata?: ChecklistMetadata
  ): ChecklistVuln[] {
    const vulns: ChecklistVuln[] = [];
    for (const control of profile.controls) {
      const defaultId = _.get(control, 'id', '');
      const vuln: ChecklistVuln = {
        status: this.getStatus(control.results, control.impact),
        vulnNum:
          metadata?.vulidmapping === 'gid'
            ? _.get(control.tags, 'gid', defaultId)
            : defaultId,
        severity: this.severityMap(control.impact),
        groupTitle: _.get(control.tags, 'gtitle', defaultId),
        ruleId: _.get(control.tags, 'rid', defaultId),
        ruleVer: _.get(control.tags, 'stig_id', defaultId),
        ruleTitle: control.title ?? '',
        vulnDiscuss: control.desc ?? '',
        iaControls: _.get(control.tags, 'IA_Controls', ''),
        checkContent:
          _.get(control.tags, 'check') ??
          (getDescription(
            control.descriptions as ExecJSON.ControlDescription[],
            'check'
          ) as string) ??
          '',
        fixText:
          _.get(control.tags, 'fix') ??
          (getDescription(
            control.descriptions as ExecJSON.ControlDescription[],
            'fix'
          ) as string) ??
          '',
        falsePositives: _.get(control.tags, 'False_Positives', ''),
        falseNegatives: _.get(control.tags, 'False_Negatives', ''),
        documentable: 'false',
        mitigations: _.get(control.tags, 'Mitigations', ''),
        potentialImpact: _.get(control.tags, 'Potential_Impact', ''),
        thirdPartyTools: this.addHdfControlSpecificData(control),
        mitigationControl: _.get(control.tags, 'Mitigation_Control', ''),
        responsibility: _.get(control.tags, 'Responsibility', ''),
        securityOverrideGuidance: _.get(
          control.tags,
          'Security_Override_Guidance',
          ''
        ),
        checkContentRef: 'M',
        weight: _.get(control.tags, 'weight', '10.0'), // default found on checklists saved from stigviewer has always been 10.0
        class: 'Unclass',
        stigRef,
        targetKey: '',
        stigUuid: '',
        legacyId: _.get(control.tags, 'Legacy_ID'),
        cciRef:
          _.get(control.tags, 'cci') ??
          this.matchNistToCcis(_.get(control.tags, 'nist')),
        comments: this.getComments(
          control.descriptions as ExecJSON.ControlDescription[]
        ),
        findingdetails: this.getFindingDetails(control.results) ?? '',
        severityjustification: '',
        severityoverride: Severityoverride.Empty
      };
      vulns.push(vuln);
    }
    return vulns;
  }

  getReleaseInfo(
    releasenumber: number | undefined,
    releasedate: string | undefined
  ): string | undefined {
    if (releasenumber && releasedate) {
      return `Release: ${releasenumber} Benchmark Date: ${releasedate}`;
    } else if (releasenumber) {
      return `Release: ${releasenumber}`;
    } else if (releasedate) {
      return `Benchmark Date: ${releasedate}`;
    } else {
      return undefined;
    }
  }

  /**
   * This function is assuming the hdf does not have 'passthrough.checklist' object
   * therefore would also not have checklist specific control.tags
   * @param hdf
   * @returns
   */
  hdfToIntermediateObject(hdf: ExecJSON.Execution): ChecklistObject {
    const stigs: ChecklistStig[] = [];
    const metadata: ChecklistMetadata | undefined = _.get(
      hdf,
      'passthrough.metadata'
    ) as unknown as ChecklistMetadata | undefined;
    for (const profile of hdf.profiles) {
      // if profile is overlay or parent profile, skip
      if (profile.depends?.length) {
        continue;
      }
      const profileMetadata = metadata?.profiles.find(
        (p) => p.name === profile.name
      );
      if (profileMetadata) {
        const results = validateProfileMetadata(profileMetadata);
        if (!results.ok) {
          throw new Error(results.error.message);
        }
      }

      const version = coerce(profile.version);
      const header: StigHeader = {
        version: _.get(
          profileMetadata,
          'version',
          version?.major ?? 0
        ).toString(),
        classification: 'UNCLASSIFIED',
        customname: this.addHdfProfileSpecificData(profile),
        stigid: profile.name,
        description:
          (profile.summary || '') +
          (profile.summary && profile.description ? '\n' : '') +
          (profile.description || ''),
        filename: '',
        releaseinfo: this.getReleaseInfo(
          profileMetadata?.releasenumber || version?.minor || 0,
          profileMetadata?.releasedate
        ),
        title: profileMetadata?.title || profile.title || profile.name,
        uuid: '',
        notice: profile.license || '',
        source: 'STIG.DOD.MIL'
      };
      const stigRef = `${header.title} :: Version ${header.version}${
        header.releaseinfo ? ', ' + header.releaseinfo : ''
      }`;
      const vulns: ChecklistVuln[] = this.controlsToVulns(
        profile,
        stigRef,
        metadata
      );
      stigs.push({header, vulns});
    }
    const checklistObject: ChecklistObject = {
      asset: {
        assettype: _.get(
          hdf,
          'passthrough.metadata.assettype',
          Assettype.Computing
        ),
        hostfqdn: _.get(hdf, 'passthrough.metadata.hostfqdn', ''),
        hostip: _.get(hdf, 'passthrough.metadata.hostip', ''),
        hostmac: _.get(hdf, 'passthrough.metadata.hostmac', ''),
        hostname: _.get(hdf, 'passthrough.metadata.hostname', ''),
        marking: _.get(hdf, 'passthrough.metadata.marking', 'CUI'),
        role: _.get(hdf, 'passthrough.metadata.role', Role.None),
        targetcomment: _.get(hdf, 'passthrough.metadata.targetcomment', ''),
        targetkey: '',
        techarea: _.get(hdf, 'passthrough.metadata.techarea', Techarea.Empty),
        webdbinstance: _.get(hdf, 'passthrough.metadata.webdbinstance', ''),
        webdbsite: _.get(hdf, 'passthrough.metadata.webdbsite', ''),
        webordatabase: [true, 'true'].includes(
          _.get(hdf, 'passthrough.metadata.webordatabase', false) as
            | string
            | boolean
        )
      },
      stigs: stigs
    };
    return checklistObject;
  }
}
