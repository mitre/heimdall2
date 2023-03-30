import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../../package.json';
import { ChecklistJSONIX } from '../../types/checklistJsonix';
import {
  BaseConverter,
  generateHash,
  ILookupPath,
  MappedTransform,
  parseXmlToJsonix
} from '../base-converter';
import {CciNistMapping} from '../mappings/CciNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from '../utils/global';
import * as checklistMapping from './jsonixMapping';
import {
  ChecklistObject,
  ChecklistVuln,
  createChecklistObject
} from './checklistConstructor';

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
  const identifiers: string[] = cciRef(input);
  return CCI_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

enum ImpactMapping {
  high = 0.7,
  medium = 0.5,
  low = 0.3
};

/**
 * Transformer function that checks if the status is 'Not Applicable' returning a 0.
 * Otherwise, maps severity to ImpactMapping
 * @param vuln - checklist vulnerability object
 * @returns impact - number 0.3, 0.5, or 0.7
 */
function transformImpact(vuln: ChecklistVuln): number {  
  if (vuln.status === 'Not Applicable') return 0.0;
  const severity = findSeverity(vuln);
  // check if severity does not exists within ImpactMapping throw new Error
  //throw new Error("Mapping does not exist");
  return ImpactMapping[severity.toString().toLowerCase() as keyof typeof ImpactMapping];
}

/**
 * Inner function to check is there was a severify override which would alter
 * the impact of the vulnerability
 * @param vuln - checklist vulnerability object
 * @returns - severity
 */
function findSeverity(vuln: ChecklistVuln): string {
  if (vuln.severityoverride) {
    return vuln.severityoverride;
  }
  return vuln.severity;
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
 * Transformer function that uses current heimdall checklist export syntax for
 * findingDetails attribute to separate a single string into multiple
 * result objects
 * @param input - array of one element consisting of {code_desc, status, start_time}
 * @returns ExecJSON.ControlResult
 */
function parseFindingDetails(input: unknown[]): ExecJSON.ControlResult[] {
  const results: ExecJSON.ControlResult[] = [];
  if (Array.isArray(input)) {
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
  } else {
    return input as ExecJSON.ControlResult[];
  }
}

/**
 * ChecklistResults is a wrapper for ChecklistMapper using the intakeType
 *  default returns a single hdf object without any modifications
 *  split returns multiple hdf object based on number of iSTIG objects in checklist
 *  wrapper returns a single hdf object with an additional profile created using file name as profile name and adds parent_profile key to each mapped profile
 */
export class ChecklistResults {
  checklistXml: string;
  raw: ChecklistJSONIX;
  checklistObject: ChecklistObject;

  /**
   * Creates instance of ChecklistResult object because baseConverter does not return ExecJSON.Execution[] type.
   * Constructor takes an addtional (optional) param object supplementalInfo
   * @param checklistXml - string of xml data
   */
  constructor(
    checklistXml: string,
  ) {
    this.checklistXml = checklistXml;
    this.raw = parseXmlToJsonix(
      this.checklistXml,
      checklistMapping.jsonixMapping
    ) as ChecklistJSONIX;
    this.checklistObject = createChecklistObject(
      this.raw,
    );
  }

  toHdf(): ExecJSON.Execution {
    const numberOfStigs = this.checklistObject.stigs.length
    if (numberOfStigs === 1) {
      const defaultChecklist = new ChecklistMapper(this.checklistObject);
      return defaultChecklist.toHdf();
    } else {
      const checklist = new ChecklistMapper(this.checklistObject);
      const original = checklist.toHdf();
      const parentProfileName = 'Parent Profile';
      const parent_profile: ExecJSON.Profile = {
        name: parentProfileName,
        version: HeimdallToolsVersion,
        supports: [],
        attributes: [],
        groups: [],
        depends: [],
        controls: [],
        sha256: ''
      };
      for (const profile of original.profiles) {
        parent_profile.depends?.push({name: profile.name});
        parent_profile.controls.push(...profile.controls);
        profile.parent_profile = parentProfileName;
        profile.sha256 = generateHash(
          JSON.stringify(profile)
        );
      }
      parent_profile.sha256 = generateHash(JSON.stringify(parent_profile));
      original.profiles.push(parent_profile);
      return original;
    }
  }
}

/**
 * Checklist mapper
 */
export class ChecklistMapper extends BaseConverter {
  withRaw: boolean;
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
              gtitle: {path: 'groupTitle'},
              rid: {path: 'ruleId'},
              gid: {path: 'vulnNum'},
              stig_id: {path: 'ruleVersion'},
              cci: {
                path: 'cciRef',
                transformer: cciRef
              },
              nist: {
                path: 'cciRef',
                transformer: nistTag
              },
              weight: {path: 'weight'},
              transformer: (input: ChecklistVuln): Record<string, unknown> => {
                const tags = [
                  ['ia_controls', 'iaControls'],
                  ['legacy_id', 'legacyId'],
                  ['false_positives', 'falsePositives'],
                  ['false_negatives', 'falseNegatives'],
                  ['mitigations', 'mitigations'],
                  ['mitigation_controls', 'mitigationControl'],
                  ['potential_impact', 'potentialImpact'],
                  ['responsibility', 'responsibility'],
                  ['stig_ref', 'stigRef'],
                  ['security_override_guidance', 'securityOverrideGuidance'],
                  ['severity_justification', 'severityJustification']
                ];
                const fullTags: Record<string, unknown> = {};
                for (const [key, path] of tags) {
                    const tagValue = _.get(input, path);
                    if (tagValue && tagValue !== '; ') {
                      fullTags[key] = tagValue;
                    }
                }
                return fullTags;
              }
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
              },
              {
                data: {path: 'comments'},
                label: 'comments'
              }
            ],
            impact: {
              transformer: (vulnerability: ChecklistVuln): number =>
                transformImpact(vulnerability)
            },
            code: {
              transformer: (vulnerability: ChecklistVuln): string =>
                JSON.stringify(vulnerability, null, 2)
            },
            results: [
              {
                arrayTransformer: parseFindingDetails,
                status: {
                  path: 'status',
                  transformer: getStatus
                },
                code_desc: {path: 'findingdetails'},
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: ChecklistObject): Record<string, unknown> => {
        return {
          ...{
            checklist: {
              asset: data.asset,
              stigs: data.stigs
            }
          },
          ...(this.withRaw) && {raw: data.raw}
        };
      }
    }
  };

  /**
   *
   * @param checklistObject - 
   */
  constructor(checklistObject: ChecklistObject, withRaw = false) {
    super(checklistObject);
    this.withRaw = withRaw;
  }
}
