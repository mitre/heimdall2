import {Jsonix} from '@mitre/jsonix';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  generateHash,
  ILookupPath,
  MappedTransform,
  parseXmlToJsonix
} from './base-converter';
import {CciNistMapping} from './mappings/CciNistMapping';
import {jsonixMapping} from './mappings/ChecklistMapping';
import {
  ChecklistFile,
  createChecklistObject
} from './mappings/ChecklistMappingData';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';

/**
 * Reverts checklist - not implemented yet and should be moved to base-converter.ts
 * @param data
 * @returns checklist
 * @experimental
 */
function revertChecklist(data: Record<string, unknown>): string {
  const context = new Jsonix.Context([jsonixMapping]);

  const marshaller = context.createMarshaller();
  return marshaller.marshalString(data);
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
 * Checklist converter - not implemented and may be used in
 * conjunction with revertChecklist (also experimental)
 * @experimental
 */
export class ChecklistConverter {
  static toChecklist(data: ChecklistFile): string {
    // Updating assets
    const asset = {...data.asset, TYPE_NAME: 'Checklist.ASSET'};
    _.set(data, 'raw.value.asset', asset);

    // Updating marked-up rule data
    _.get(data.raw as unknown, 'value.stigs.istig').forEach(
      (stig: any, stig_index: number) => {
        _.get(stig, 'vuln').forEach((vuln: any, vuln_index: number) => {
          _.set(
            vuln,
            'status',
            STATUS_MAPPING.get(data.stigs[stig_index].vulns[vuln_index].status)
          );
          _.set(
            vuln,
            'findingdetails',
            data.stigs[stig_index].vulns[vuln_index].findingDetails
          );
          _.set(
            vuln,
            'comments',
            data.stigs[stig_index].vulns[vuln_index].comments
          );
          _.set(
            vuln,
            'severityoverride',
            data.stigs[stig_index].vulns[vuln_index].severityOverride
          );
          _.set(
            vuln,
            'severityjustification',
            data.stigs[stig_index].vulns[vuln_index].severityJustification
          );
        });
      }
    );

    return revertChecklist(data.raw);
  }
}

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['none', 0.0]
]);

/**
 * Tranformer function that splits a string and return array
 * @param input - string of CCI references
 * @returns ref - array of CCI references
 */
function cciRef(input: string): string[] {
  return input.split('; ');
}

const CCI_NIST_MAPPING = new CciNistMapping();

/**
 * Transformer function that splits string and maps resulting array
 * into NIST control tags
 * @param input - string of CCI references
 * @returns tag - array of NIST Control Tags
 */
function nistTag(input: string): string[] {
  const identifiers: string[] = input.split('; ');
  return CCI_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

/**
 * Transformer function that checks if the status is 'Not Applicable' returning a 0.
 * Otherwise, maps severity to IMPACT_MAPPING
 * @param vuln - checklist vulnerability object
 * @returns impact - number 0.0, 0.3, 0.5, or 0.7
 * @default is 0
 */
function transformImpact(vuln: Record<string, any>): number {
  if (vuln.status === 'Not Applicable') return 0.0;
  const severity = findSeverity(vuln);
  return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
}

/**
 * Inner function to check is there was a severify override which would alter
 * the impact of the vulnerability
 * @param vuln - checklist vulnerability object
 * @returns - severity
 */
function findSeverity(vuln: Record<string, any>): string {
  if (vuln.severityOverride.length > 0) {
    return vuln.severityOverride;
  }
  return vuln.severity;
}

/**
 * Transformer function that uses current heimdall checklist export syntax for
 * findingDetails attribute to separate a single string into multiple
 * result objects
 * @param input - array of one element consisting of {code_desc, status, start_time}
 * @returns ExecJSON.ControlResult
 */
function parseFindingDetails(
  input: Record<string, any>
): ExecJSON.ControlResult[] {
  const results: ExecJSON.ControlResult[] = [];
  const findings: string = input[0].code_desc;
  if (findings.length !== 0) {
    const splitFindings: string[] = findings.split(
      '--------------------------------\n' // join variable identified from cklResults function in ExportCKLModal.vue
    );
    splitFindings.forEach((details) => {
      let codeDesc = '';
      let status = '';
      let message = '';
      const splitResults: string[] = details.split(/\n(.*)/s, 2); // split using the first new line character only
      if (
        splitResults[0] === 'passed' ||
        splitResults[0] === 'failed' ||
        splitResults[0] === 'skipped' ||
        splitResults[0] === 'error'
      ) {
        // This does not necessarily work when the code_desc has the word expected
        // will need to update the export to add a key word that can be used to split code_desc
        // and message values easier - maybe *results* or *details*
        const indexOfExpected = splitResults[1].indexOf('expected');
        if (indexOfExpected > 0) {
          codeDesc = splitResults[1].slice(0, indexOfExpected - 1);
          message = splitResults[1].slice(indexOfExpected);
          status = splitResults[0];
        } else {
          codeDesc = splitResults[1];
          status = splitResults[0];
        }
      } else {
        codeDesc = details;
        status = input[0].status;
      }
      const hdfResult: ExecJSON.ControlResult = {
        code_desc: codeDesc,
        status: getStatus(status),
        start_time: '',
        message: message
      };
      results.push(hdfResult);
    });
    return results;
  } else {
    return [
      {
        code_desc: input[0].code_desc,
        status: getStatus(input[0].status),
        start_time: ''
      }
    ] as ExecJSON.ControlResult[];
  }
}

/**
 * Transformer function that returns appropriate enum value based on param
 * This is required because the status value of the ControlResult object
 * must be an ExecJSON.ControlResultStatus type
 * @param input - string
 * @returns enum ExecJSON.ControlResultStatus
 */
function getStatus(input: string): ExecJSON.ControlResultStatus {
  const status = input.toLowerCase();
  switch (status) {
    case 'notafinding':
    case 'passed':
      return ExecJSON.ControlResultStatus.Passed;
    case 'open':
    case 'failed':
      return ExecJSON.ControlResultStatus.Failed;
    case 'error':
      return ExecJSON.ControlResultStatus.Error;
    default:
      return ExecJSON.ControlResultStatus.Skipped;
  }
}

/**
 * Object for checklistResults constructor
 *
 */
export type checklistSupplementalInfo = {
  filename: string;
  intakeType: 'split' | 'wrapper' | 'default';
};

/**
 * ChecklistResults is a wrapper for ChecklistMapper using the intakeType
 *  default returns a single hdf object without any modifications
 *  split returns multiple hdf object based on number of iSTIG objects in checklist
 *  wrapper returns a single hdf object with an additional profile created using file name as profile name and adds parent_profile key to each mapped profile
 */
export class ChecklistResults {
  checklistXml: string;
  suppInfo: checklistSupplementalInfo;

  /**
   * Creates instance of ChecklistResult object because baseConverter does not return ExecJSON.Execution[] type.
   * Constructor takes an addtional (optional) param object supplementalInfo
   * @param checklistXml - string of xml data
   * @param supplementalInfo - object containing filename and intakeType
   * @param supplementalInfo.filename - string of checklist filename
   * @param supplementalInfo.intakeType - string to determine default, split into multiple objects, wrapper creates a wrapper profile.
   */
  constructor(
    checklistXml: string,
    supplementalInfo?: checklistSupplementalInfo
  ) {
    this.checklistXml = checklistXml;
    this.suppInfo = supplementalInfo || {
      filename: 'checklist.ckl',
      intakeType: 'default'
    };
  }

  toHdf(): ExecJSON.Execution[] | ExecJSON.Execution {
    const fullChecklistJsonix = parseXmlToJsonix(
      this.checklistXml,
      jsonixMapping
    );
    const fullChecklistObject = createChecklistObject(
      fullChecklistJsonix,
      this.suppInfo.filename
    );
    switch (this.suppInfo.intakeType) {
      case 'default':
        const defaultChecklist = new ChecklistMapper(fullChecklistObject);
        return defaultChecklist.toHdf();
      case 'split':
        const returnArray: ExecJSON.Execution[] = [];
        const splitString = this.checklistXml.split(/<iSTIG>|<\/iSTIG>/g);
        let fileNumber = 1;
        for (let i = 1; i < splitString.length; i += 2) {
          const checklistXmlString = `${splitString[0]}<iSTIG>${
            splitString[i]
          }</iSTIG>${splitString[splitString.length - 1]}`;
          const extIndex = this.suppInfo.filename.lastIndexOf('.');
          const filename = `${this.suppInfo.filename.substring(
            0,
            extIndex
          )}-${fileNumber}${this.suppInfo.filename.substring(extIndex)}`;
          const checklistJsonix = parseXmlToJsonix(
            checklistXmlString,
            jsonixMapping
          );
          const checklistObject = createChecklistObject(
            checklistJsonix,
            filename
          );
          const entry = new ChecklistMapper(checklistObject);
          returnArray.push(entry.toHdf());
          fileNumber++;
        }
        return returnArray;
      case 'wrapper':
        const checklist = new ChecklistMapper(fullChecklistObject);
        const original = checklist.toHdf();
        const parentProfileName = this.suppInfo.filename.replace(/\.ckl/gi, '');
        const parent_profile: ExecJSON.Profile = {
          name: parentProfileName,
          supports: [],
          attributes: [],
          groups: [],
          controls: [],
          sha256: ''
        };
        parent_profile.sha256 = generateHash(JSON.stringify(parent_profile));
        for (const i in original.profiles) {
          original.profiles[i].parent_profile = parentProfileName;
          original.profiles[i].sha256 = generateHash(
            JSON.stringify(original.profiles[i])
          );
        }
        original.profiles.push(parent_profile);
        return original;
    }
  }
}

/**
 * Checklist mapper
 */
export class ChecklistMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        path: 'stigs',
        name: {path: 'header.title'},
        version: {path: 'header.version'},
        title: {path: 'header.title'},
        summary: {path: 'header.description'},
        license: {path: 'header.notice'},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'vulns',
            key: 'id',
            tags: {
              default: {path: 'vulnDiscuss'},
              gtitle: {path: 'groupTitle'},
              rid: {path: 'ruleId'},
              gid: {path: 'vulnNum'},
              stigId: {path: 'ruleVersion'},
              cci: {
                path: 'cciRef',
                transformer: cciRef
              },
              nist: {
                path: 'cciRef',
                transformer: nistTag
              },
              weight: {path: 'weight'}
            },
            refs: [],
            source_location: {},
            title: {path: 'ruleTitle'},
            id: {path: 'vulnNum'},
            desc: {path: 'vulnDiscuss'},
            descriptions: [
              {
                data: {path: 'checkContent'},
                label: 'check'
              },
              {
                data: {path: 'fixText'},
                label: 'fix'
              }
            ],
            impact: {
              transformer: (vulnerability: Record<string, unknown>): number =>
                transformImpact(vulnerability)
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2)
            },
            results: [
              {
                arrayTransformer: parseFindingDetails,
                status: {
                  path: 'status',
                  transformer: getStatus
                },
                code_desc: {path: 'findingDetails'},
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {
          ...{
            mutableChecklist: {
              filename: data.filename,
              asset: data.asset,
              stigs: data.stigs,
              raw: data.raw
            }
          }
        };
      }
    }
  };

  /**
   *
   * @param checklistObject - ChecklistFile object (omitting the uniqueId)
   */
  constructor(checklistObject: Omit<ChecklistFile, 'uniqueId'>) {
    super(checklistObject);
  }
}
