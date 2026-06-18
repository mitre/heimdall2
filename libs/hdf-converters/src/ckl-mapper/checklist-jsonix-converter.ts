import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import { coerce } from 'semver';
import { JsonixIntermediateConverter } from '../jsonix-intermediate-converter';
import { CciNistTwoWayMapper } from '../mappings/CciNistMapping';
import { getDescription } from '../utils/global';
import { throwIfInvalidProfileMetadata } from './checklist-metadata-utils';
import type {
  Asset,
  Checklist,
  Istig,
  Name,
  Sidata,
  Sidname,
  Status,
  Stigdata,
  StigdatumElement,
  Vuln,
} from './checklistJsonix';
import {
  Assettype,
  LocalPartEnum,
  Role,
  Severityoverride,
  Techarea,
  Vulnattribute,
} from './checklistJsonix';

export type ChecklistObject = {
  asset: ChecklistAsset;
  jsonixData?: Checklist;
  stigs: ChecklistStig[];
};

type ChecklistAsset = Asset;

export type ChecklistStig = {
  header: StigHeader;
  vulns: ChecklistVuln[];
};

type StigHeader = {
  classification:
    | 'CUI'
    | 'UNCLASSIFIED'
    | 'UNCLASSIFIED//FOR OFFICIAL USE ONLY';
  customname?: string;
  description: string;
  filename: string;
  notice?: string;
  releaseinfo?: string;
  source?: string;
  stigid: string;
  title: string;
  uuid: string;
  version: string;
};

// omit status to overwrite possible HDF status values
export type ChecklistVuln = Omit<Vuln, 'status' | 'stigdata'> & {
  cciRef: string;
  checkContent: string;
  checkContentRef: string;
  class: 'CUI' | 'FOUO' | 'Unclass';
  documentable: string;
  falseNegatives: string;
  falsePositives: string;
  fixText: string;
  groupTitle: string;
  iaControls: string;
  legacyId: string;
  mitigationControl: string;
  mitigations: string;
  potentialImpact: string;
  responsibility: string;
  ruleId: string;
  ruleTitle: string;
  ruleVer: string;
  securityOverrideGuidance: string;
  severity: Severity;
  status: StatusMapping;
  stigRef: string;
  stigUuid: string;
  targetKey: string;
  thirdPartyTools: string;
  vulnDiscuss: string;
  vulnNum: string;
  weight: string;
};

// Status mapping for going to and from checklist
export enum StatusMapping {
  Not_Applicable = 'Not Applicable',
  Not_Reviewed = 'Not Reviewed',
  NotAFinding = 'Passed',
  Open = 'Failed',
}

const SEPARATOR_RE = /[,;\|]/v;

const IMPACT_MAPPING = new Map<string, number>([
  ['critical', 0.9],
  ['high', 0.7],
  ['low', 0.3],
  ['medium', 0.5],
  ['none', 0],
]);

export enum Severity {
  Empty = '',
  High = 'high',
  Low = 'low',
  Medium = 'medium',
}

export type ChecklistMetadata = {
  assettype: Assettype;
  hostfqdn: string;
  hostip: string;
  hostmac: string;
  hostname: string;
  marking: string;
  profiles: StigMetadata[];
  role: Role;
  targetcomment: string;
  techarea: Techarea;
  vulidmapping: 'gid' | 'id';
  webdbinstance: string;
  webdbsite: string;
  webordatabase: string;
};

export type StigMetadata = {
  name: string;
  releasedate: string;
  releasenumber: number;
  showCalendar: boolean;
  title: string;
  version: number;
};

export const EmptyChecklistObject: ChecklistObject = {
  asset: {
    assettype: Assettype.Computing,
    hostfqdn: null,
    hostip: null,
    hostmac: null,
    hostname: null,
    marking: 'CUI',
    role: Role.None,
    targetcomment: null,
    targetkey: null,
    techarea: Techarea.Empty,
    webdbinstance: null,
    webdbsite: null,
    webordatabase: null,
  },
  stigs: [
    {
      header: {
        classification: 'UNCLASSIFIED',
        description: '',
        filename: '',
        stigid: '',
        title: '',
        uuid: '',
        version: '',
      },
      vulns: [
        {
          cciRef: '',
          checkContent: '',
          checkContentRef: '',
          class: 'Unclass',
          comments: null,
          documentable: 'false',
          falseNegatives: '',
          falsePositives: '',
          findingdetails: null,
          fixText: '',
          groupTitle: '',
          iaControls: '',
          legacyId: '',
          mitigationControl: '',
          mitigations: '',
          potentialImpact: '',
          responsibility: '',
          ruleId: '',
          ruleTitle: '',
          ruleVer: '',
          securityOverrideGuidance: '',
          severity: Severity.Low,
          severityjustification: null,
          severityoverride: Severityoverride.Empty,
          status: StatusMapping.Not_Reviewed,
          stigRef: '',
          stigUuid: '',
          targetKey: '',
          thirdPartyTools: '',
          vulnDiscuss: '',
          vulnNum: '',
          weight: '',
        },
      ],
    },
  ],
};

export function updateChecklistWithMetadata(
  file: ExecJSON.Execution,
): ChecklistObject {
  const metadata: ChecklistMetadata = _.get(
    file,
    'passthrough.metadata',
  ) as unknown as ChecklistMetadata;
  const checklist: ChecklistObject = _.get(
    file,
    'passthrough.checklist',
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
    metadata.webordatabase,
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
  addHdfControlSpecificData(control: ExecJSON.Control): string {
    const hdfSpecificData: Record<string, unknown> = {};

    const impact = control.impact;
    const severityTag = _.get(control.tags, 'severity', null);
    const severityOverrideTag = _.get(control.tags, 'severityoverride', null);

    // if severity or severity override don't fit into low, medium, high
    // denote them in the control specific data
    if (severityTag === 'none' || severityTag === 'critical') {
      hdfSpecificData.severity = severityTag;
    }

    if (severityOverrideTag === 'none' || severityOverrideTag === 'critical') {
      hdfSpecificData.severityoverride = severityOverrideTag;
    }

    // if impact does not align with what would be computed from the checklist
    // store it in the hdfSpecificData
    // also, if it needs to be represented with none or critical, it has
    // to be stored in the hdfSpecificData
    const computedImpact = this.computeImpact(severityTag, severityOverrideTag);
    if (
      ((computedImpact !== undefined && computedImpact !== impact)
        || impact < 0.1
        || impact >= 0.9)
      && impact !== 0
    ) {
      hdfSpecificData.impact = control.impact;
    }

    // if there is no severity tag, severity is aligned to impact
    // this must be represented in hdfSpecificData when impact needs to
    // map to severity none or critical
    if (severityTag === null) {
      if (impact < 0.1) {
        hdfSpecificData.severity = 'none';
      } else if (impact >= 0.9) {
        hdfSpecificData.severity = 'critical';
      }
    }

    if (control.code?.startsWith('control')) {
      hdfSpecificData.code = control.code;
    }

    const hdfDataExist = Object.keys(hdfSpecificData).length > 0;

    return hdfDataExist
      ? JSON.stringify({ hdfSpecificData: hdfSpecificData }, null, 2)
      : '';
  }

  addHdfProfileSpecificData(profile: ExecJSON.Profile): string {
    const hdfSpecificData: Record<string, unknown> = {};
    if (profile.attributes.length > 0) {
      hdfSpecificData.attributes = profile.attributes;
    }
    if (profile.copyright) {
      hdfSpecificData.copyright = profile.copyright;
    }
    if (profile.copyright_email) {
      hdfSpecificData.copyright_email = profile.copyright_email;
    }
    if (profile.maintainer) {
      hdfSpecificData.maintainer = profile.maintainer;
    }
    if (profile.version) {
      hdfSpecificData.version = profile.version;
    }

    const hdfDataExist = Object.keys(hdfSpecificData).length > 0;
    return hdfDataExist ? JSON.stringify({ hdfSpecificData }) : '';
  }

  // computes what the impact would be based on the given tags
  computeImpact(
    severityTag: null | string,
    severityOverrideTag: null | string,
  ): number | undefined {
    let computedSeverity = severityTag;
    if (severityOverrideTag) {
      computedSeverity = severityOverrideTag;
    }
    computedSeverity = computedSeverity?.toLowerCase() ?? null;
    if (computedSeverity) {
      return IMPACT_MAPPING.get(computedSeverity);
    }
  }

  controlsToVulns(
    profile: ExecJSON.Profile,
    stigRef: string,
    metadata?: ChecklistMetadata,
  ): ChecklistVuln[] {
    const vulns: ChecklistVuln[] = [];
    for (const control of profile.controls) {
      const defaultId = _.get(control, 'id', '');
      const vuln: ChecklistVuln = {
        cciRef:
          _.get(control.tags, 'cci')
          ?? this.matchNistToCcis(_.get(control.tags, 'nist')),
        checkContent:
          _.get(control.tags, 'check')
          ?? (getDescription(
            control.descriptions!,
            'check',
          )!)
          ?? '',
        checkContentRef: 'M',
        class: 'Unclass',
        comments: this.getComments(
          control.descriptions!,
        ),
        documentable: 'false',
        falseNegatives: _.get(control.tags, 'False_Negatives', ''),
        falsePositives: _.get(control.tags, 'False_Positives', ''),
        findingdetails: this.getFindingDetails(control.results) ?? '',
        fixText:
          _.get(control.tags, 'fix')
          ?? (getDescription(
            control.descriptions!,
            'fix',
          )!)
          ?? '',
        groupTitle: _.get(control.tags, 'gtitle', defaultId),
        iaControls: _.get(control.tags, 'IA_Controls', ''),
        legacyId: _.get(control.tags, 'Legacy_ID'),
        mitigationControl: _.get(control.tags, 'Mitigation_Control', ''),
        mitigations: _.get(control.tags, 'Mitigations', ''),
        potentialImpact: _.get(control.tags, 'Potential_Impact', ''),
        responsibility: _.get(control.tags, 'Responsibility', ''),
        ruleId: _.get(control.tags, 'rid', defaultId),
        ruleTitle: control.title ?? '',
        ruleVer: _.get(control.tags, 'stig_id', defaultId),
        securityOverrideGuidance: _.get(
          control.tags,
          'Security_Override_Guidance',
          '',
        ),
        severity: this.severityMap(
          control.impact,
          _.get(control.tags, 'severity', Severity.Empty),
        ),
        severityjustification: _.get(
          control.tags,
          'severityjustification',
          Severityoverride.Empty,
        ),
        severityoverride: _.get(
          control.tags,
          'severityoverride',
          Severityoverride.Empty,
        ),
        status: this.getStatus(control.results, control.impact),
        stigRef,
        stigUuid: '',
        targetKey: '',
        thirdPartyTools: this.addHdfControlSpecificData(control),
        vulnDiscuss: control.desc ?? '',
        vulnNum:
          metadata?.vulidmapping === 'gid'
            ? _.get(control.tags, 'gid', defaultId)
            : defaultId,
        weight: _.get(control.tags, 'weight', '10.0'), // default found on checklists saved from stigviewer has always been 10.0
      };
      vulns.push(vuln);
    }
    return vulns;
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
        stigdata: stigdata,
      };
      vulns.push(vuln);
    }
    return vulns;
  }

  expandHeader(header: StigHeader): Sidata[] {
    const sidata: Sidata[] = [];
    for (const [name, data] of Object.entries(header)) {
      if (data) {
        sidata.push({
          siddata: data,
          sidname: name as Sidname,
        });
      } else {
        sidata.push({ sidname: name as Sidname });
      }
    }
    return sidata;
  }

  expandVulns(checklistVuln: ChecklistVuln): StigdatumElement[] {
    const separateElementNames = new Set(['CciRef', 'IAControls', 'LegacyID']);
    const stigdata: StigdatumElement[] = [];
    for (const [attributeName, data] of Object.entries(checklistVuln)) {
      const keyFoundInVulnattribute: string | undefined = Object.keys(
        Vulnattribute,
      ).find(key => key.toLowerCase() === attributeName.toLowerCase());
      if (keyFoundInVulnattribute) {
        if (separateElementNames.has(keyFoundInVulnattribute)) {
          const dataStrings = data?.toString().split(SEPARATOR_RE) ?? [];
          for (const dataString of dataStrings) {
            stigdata.push({
              attributedata: dataString.trim(),
              vulnattribute:
                Vulnattribute[
                  keyFoundInVulnattribute as keyof typeof Vulnattribute
                ],
            });
          }
          continue;
        }
        stigdata.push({
          attributedata: data!,
          vulnattribute:
            Vulnattribute[
              keyFoundInVulnattribute as keyof typeof Vulnattribute
            ],
        });
      }
    }
    return stigdata;
  }

  fromIntermediateObject(intermediateObj: ChecklistObject): Checklist {
    const name: Name = { localPart: LocalPartEnum.Checklist };
    const istigs: Istig[] = [];
    for (const stig of intermediateObj.stigs) {
      const istig: Istig = {
        stiginfo: { sidata: this.expandHeader(stig.header) },
        vuln: this.createVulns(stig.vulns),
      };
      istigs.push(istig);
    }
    const value: Stigdata = {
      asset: { ...intermediateObj.asset },
      stigs: { istig: istigs },
    };
    const checklist: Checklist = {
      name: name,
      value: value,
    };
    return checklist;
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

  getFindingDetails(results: ExecJSON.ControlResult[]): string {
    return results === undefined
      ? ''
      : results
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

  getReleaseInfo(
    releasenumber: number | undefined,
    releasedate: string | undefined,
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

  getValueFromAttributeName<T extends Sidata | Stigdata>(
    data: T[],
    tag: string,
  ): string {
    let keyName = 'vulnattribute';
    let dataName = 'attributedata';
    if (data.every(o => 'sidname' in o)) {
      keyName = 'sidname';
      dataName = 'siddata';
    }
    const results = data.filter((attribute: T) => {
      return _.get(attribute, keyName) == tag;
    });
    return results.map((result: T) => _.get(result, dataName)).join('; ');
  }

  /**
   * Converts an HDF (Heimdall Data Format) execution object to a ChecklistObject.
   * This function assumes the HDF does not have a 'passthrough.checklist' object,
   * and therefore would also not have checklist-specific control.tags
   *
   * @param hdf - The HDF execution object to convert.
   * @returns {ChecklistObject} The converted ChecklistObject.
   */
  hdfToIntermediateObject(hdf: ExecJSON.Execution): ChecklistObject {
    const stigs: ChecklistStig[] = [];
    const metadata = (hdf as ExecJSON.Execution & { passthrough?: { metadata?: ChecklistMetadata } }).passthrough?.metadata;
    for (const profile of hdf.profiles) {
      // if profile is overlay or parent profile, skip
      if (profile.depends?.length) {
        continue;
      }
      const profileMetadata = metadata?.profiles.find(
        p => p.name === profile.name,
      );
      throwIfInvalidProfileMetadata(profileMetadata);

      const version = coerce(profile.version);
      const header: StigHeader = {
        classification: 'UNCLASSIFIED',
        customname: this.addHdfProfileSpecificData(profile),
        description:
          (profile.summary || '')
          + (profile.summary && profile.description ? '\n' : '')
          + (profile.description || ''),
        filename: '',
        notice: profile.license || '',
        releaseinfo: this.getReleaseInfo(
          profileMetadata?.releasenumber || version?.minor || 0,
          profileMetadata?.releasedate,
        ),
        source: 'STIG.DOD.MIL',
        stigid: profile.name,
        title: profileMetadata?.title || profile.title || profile.name,
        uuid: '',
        version: _.get(
          profileMetadata,
          'version',
          version?.major ?? 0,
        ).toString(),
      };
      const stigRef = `${header.title} :: Version ${header.version}${
        header.releaseinfo ? ', ' + header.releaseinfo : ''
      }`;
      const vulns: ChecklistVuln[] = this.controlsToVulns(
        profile,
        stigRef,
        metadata,
      );
      stigs.push({ header, vulns });
    }
    const checklistObject: ChecklistObject = {
      asset: {
        assettype: _.get(
          hdf,
          'passthrough.metadata.assettype',
          Assettype.Computing,
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
          _.get(hdf, 'passthrough.metadata.webordatabase', false),
        ),
      },
      stigs: stigs,
    };
    return checklistObject;
  }

  matchNistToCcis(nistRefs: string[]): string[] {
    if (!nistRefs) {
      return [''];
    }
    const CCI_NIST_TWO_WAY_MAPPER = new CciNistTwoWayMapper();
    return CCI_NIST_TWO_WAY_MAPPER.cciFilter(nistRefs, ['']);
  }

  severityMap(impact: number, severityTag: null | string): Severity {
    // test if this control has a valid severity tag
    // and map it to a checklist severity level
    // note: some mappers can produce non-lowercase severity tags
    switch (severityTag?.toLowerCase()) {
      case 'critical':
      case 'high': {
        // if critical, it will be added to Checklist's thirdPartyTools section
        return Severity.High;
      }
      case 'low':
      // falls through — if none, it will be added to Checklist's thirdPartyTools section
      case 'none': {
        return Severity.Low;
      }
      case 'medium': {
        return Severity.Medium;
      }
    }

    // if no valid severity tag, compute severity based on impact
    if (impact < 0.4) {
      return Severity.Low;
    } else if (impact < 0.7) {
      return Severity.Medium;
    } else {
      return Severity.High;
    }
  }

  /**
   * Creates checklist object for mapping to HDF
   * @param jsonixData - ChecklistJSONIX object
   * @returns - newChecklistObject
   */
  toIntermediateObject(jsonixData: Checklist): ChecklistObject {
    const asset: ChecklistAsset = {
      assettype: _.get(
        jsonixData,
        'value.asset.assettype',
      ) as unknown as Assettype,
      hostfqdn: _.get(jsonixData, 'value.asset.hostfqdn') as unknown as string,
      hostip: _.get(jsonixData, 'value.asset.hostip') as unknown as string,
      hostmac: _.get(jsonixData, 'value.asset.hostmac') as unknown as string,
      hostname: _.get(jsonixData, 'value.asset.hostname') as unknown as string,
      marking: _.get(jsonixData, 'value.asset.marking'),
      role: _.get(jsonixData, 'value.asset.role') as unknown as Role,
      targetcomment: _.get(
        jsonixData,
        'value.asset.targetcomment',
      ),
      targetkey: _.get(
        jsonixData,
        'value.asset.targetkey',
      ) as unknown as string,
      techarea: _.get(
        jsonixData,
        'value.asset.techarea',
      ) as unknown as Techarea,
      webdbinstance: _.get(
        jsonixData,
        'value.asset.webdbinstance',
      ) as unknown as string,
      webdbsite: _.get(
        jsonixData,
        'value.asset.webdbsite',
      ) as unknown as string,
      webordatabase: [true, 'true'].includes(
        _.get(jsonixData, 'value.asset.webordatabase', false),
      ),
    };

    const rawStigs: Istig[] = _.get(
      jsonixData,
      'value.stigs.istig',
    ) as unknown as Istig[];
    const stigs: ChecklistStig[] = [];
    for (const stig of rawStigs) {
      const stigInfo: Sidata[] = _.get(
        stig,
        'stiginfo.sidata',
      );
      const header: StigHeader = {
        classification: this.getValueFromAttributeName<Sidata>(
          stigInfo,
          'classification',
        ) as unknown as StigHeader['classification'],
        customname: this.getValueFromAttributeName<Sidata>(
          stigInfo,
          'customname',
        ),
        description: this.getValueFromAttributeName<Sidata>(
          stigInfo,
          'description',
        ),
        filename: this.getValueFromAttributeName<Sidata>(stigInfo, 'filename'),
        notice: this.getValueFromAttributeName<Sidata>(stigInfo, 'notice'),
        releaseinfo: this.getValueFromAttributeName<Sidata>(
          stigInfo,
          'releaseinfo',
        ),
        source: this.getValueFromAttributeName<Sidata>(stigInfo, 'source'),
        stigid: this.getValueFromAttributeName<Sidata>(stigInfo, 'stigid'),
        title: this.getValueFromAttributeName<Sidata>(stigInfo, 'title'),
        uuid: this.getValueFromAttributeName<Sidata>(stigInfo, 'uuid'),
        version: this.getValueFromAttributeName<Sidata>(stigInfo, 'version'),
      };

      const checklistVulns: ChecklistVuln[] = [];
      const vulns: Vuln[] = _.get(stig, 'vuln');
      for (const vuln of vulns) {
        const stigdata: Stigdata[] = _.get(vuln, 'stigdata');
        const checklistVuln: ChecklistVuln = {
          cciRef: this.getValueFromAttributeName<Stigdata>(stigdata, 'CCI_REF'),
          checkContent: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Check_Content',
          ),
          checkContentRef: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Check_Content_Ref',
          ),
          class: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Class',
          ) as unknown as ChecklistVuln['class'],
          comments: _.get(vuln, 'comments'),
          documentable: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Documentable',
          ),
          falseNegatives: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'False_Negatives',
          ),
          falsePositives: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'False_Positives',
          ),
          findingdetails: _.get(vuln, 'findingdetails'),
          fixText: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Fix_Text',
          ),
          groupTitle: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Group_Title',
          ),
          iaControls: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'IA_Controls',
          ),
          legacyId: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'LEGACY_ID',
          ),
          mitigationControl: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Mitigation_Control',
          ),
          mitigations: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Mitigations',
          ),
          potentialImpact: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Potential_Impact',
          ),
          responsibility: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Responsibility',
          ),
          ruleId: this.getValueFromAttributeName<Stigdata>(stigdata, 'Rule_ID'),
          ruleTitle: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Rule_Title',
          ),
          ruleVer: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Rule_Ver',
          ),
          securityOverrideGuidance: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Security_Override_Guidance',
          ),
          severity: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Severity',
          ) as unknown as ChecklistVuln['severity'],
          severityjustification: _.get(vuln, 'severityjustification'),
          severityoverride: _.get(vuln, 'severityoverride'),
          status: StatusMapping[_.get(vuln, 'status')],
          stigRef: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'STIGRef',
          ),
          stigUuid: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'STIG_UUID',
          ),
          targetKey: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'TargetKey',
          ),
          thirdPartyTools: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Third_Party_Tools',
          ),
          vulnDiscuss: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Vuln_Discuss',
          ),
          vulnNum: this.getValueFromAttributeName<Stigdata>(
            stigdata,
            'Vuln_Num',
          ),
          weight: this.getValueFromAttributeName<Stigdata>(stigdata, 'Weight'),
        };
        checklistVulns.push(checklistVuln);
      }

      stigs.push({
        header: header,
        vulns: checklistVulns,
      });
    }

    const checklistObject: ChecklistObject = {
      asset: asset,
      jsonixData: jsonixData,
      stigs: stigs,
    };
    return checklistObject;
  }
}
