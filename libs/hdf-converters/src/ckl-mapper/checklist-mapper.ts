import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../../package.json';
import {Checklist} from '../../types/checklistJsonix';
import {
  BaseConverter,
  generateHash,
  ILookupPath,
  MappedTransform
} from '../base-converter';
import {CciNistMapping} from '../mappings/CciNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from '../utils/global';
import {
  ChecklistJsonixConverter,
  ChecklistObject,
  ChecklistVuln
} from './checklist-jsonix-converter';
import * as checklistMapping from './jsonixMapping';

enum ImpactMapping {
  high = 0.7,
  medium = 0.5,
  low = 0.3
}

const CCI_NIST_MAPPING = new CciNistMapping();

/**
 * Tranformer function that splits a string and return array
 * @param input - string of CCI references
 * @returns ref - array of CCI references
 */
function cciRef(input: string): string[] {
  return input.split('; ');
}

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
 * Transformer function that checks if the status is 'Not Applicable' returning a 0.
 * Otherwise, maps severity to ImpactMapping
 * @param vuln - checklist vulnerability object
 * @returns impact - number 0.3, 0.5, or 0.7
 */
function transformImpact(vuln: ChecklistVuln): number {
  if (vuln.status === 'Not Applicable') return 0.0;
  const severity = findSeverity(vuln);
  const impact =
    ImpactMapping[severity.toLowerCase() as keyof typeof ImpactMapping];
  if (!impact)
    throw new Error(
      `Severity "${severity}" does not match low, medium, or high, please check severity for ${vuln.vulnnum}`
    );
  return impact;
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
  const findings = input as unknown as ExecJSON.ControlResult[];
  const results: ExecJSON.ControlResult[] = [];
  const statusSet = ['passed', 'failed', 'skipped', 'error'];

  for (const finding of findings) {
    if (!finding.code_desc) {
      results.push({
        status: finding.status,
        code_desc: finding.code_desc,
        start_time: finding.start_time
      });
    } else {
      // split into multiple findings details using heimdall2 CKLExport functionality
      for (const details of finding.code_desc.split(
        '--------------------------------\n'
      )) {
        let code_desc: string;
        let status: ExecJSON.ControlResultStatus;
        let message = '';
        // split details for status
        const [findingStatus, descAndMessage] = details.split(/\n(.*)/s, 2);
        if (statusSet.includes(findingStatus)) {
          // split desc and message
          // This does not necessarily work when the code_desc has the word expected
          // will need to update the export to add a key word that can be used to split code_desc
          // and message values easier - maybe *results* or *details*
          const indexOfExpected = descAndMessage.indexOf('\nexpected');
          if (indexOfExpected > 0) {
            code_desc = descAndMessage.slice(0, indexOfExpected - 1);
            message = descAndMessage.slice(indexOfExpected);
            status = getStatus(findingStatus);
          } else {
            code_desc = descAndMessage;
            status = getStatus(findingStatus);
          }
        } else {
          code_desc = details;
          status = finding.status as ExecJSON.ControlResultStatus;
        }
        results.push({
          code_desc,
          status,
          message: message ? message : null,
          start_time: ''
        });
      }
    }
  }
  return results;
}

/**
 * ChecklistResults is a wrapper for ChecklistMapper using the intakeType
 *  default returns a single hdf object without any modifications
 *  split returns multiple hdf object based on number of iSTIG objects in checklist
 *  wrapper returns a single hdf object with an additional profile created using file name as profile name and adds parent_profile key to each mapped profile
 */
export class ChecklistResults extends ChecklistJsonixConverter {
  checklistXml: string;
  jsonixData: Checklist;
  checklistObject: ChecklistObject;
  withRaw: boolean;

  /**
   * Creates instance of ChecklistResult object because ChecklistMapper uses the intermediate ChecklistObject to create HDF mapping
   * @param checklistXml - string of xml data
   */
  constructor(checklistXml: string, withRaw = false) {
    super(checklistXml);
    this.checklistXml = checklistXml;
    this.withRaw = withRaw;
    this.jsonixData = super.toJsonix(checklistMapping.jsonixMapping);
    this.checklistObject = super.toIntermediateObject(this.jsonixData);
  }

  toHdf(): ExecJSON.Execution {
    const numberOfStigs = this.checklistObject.stigs.length;
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
        profile.sha256 = generateHash(JSON.stringify(profile));
      }
      parent_profile.sha256 = generateHash(JSON.stringify(parent_profile));
      original.profiles.unshift(parent_profile);
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
              gtitle: {path: 'grouptitle'},
              rid: {path: 'ruleid'},
              gid: {path: 'vulnnum'},
              stig_id: {path: 'ruleversion'},
              cci: {
                path: 'cciref',
                transformer: cciRef
              },
              nist: {
                path: 'cciref',
                transformer: nistTag
              },
              weight: {path: 'weight'},
              // following transform takes the available attributes found in a checklist vuln and if available will add to the tags.
              // first element is the label name as it will appear in UI while the second is the ChecklistObject keyname
              transformer: (input: ChecklistVuln): Record<string, unknown> => {
                const tags = [
                  ['IA Controls', 'iacontrols'],
                  ['Legacy ID', 'legacyid'],
                  ['False Positives', 'falsepositives'],
                  ['False Negatives', 'falsenegatives'],
                  ['Mitigations', 'mitigations'],
                  ['Mitigation Controls', 'mitigationcontrol'],
                  ['Potential Impact', 'potentialimpact'],
                  ['Responsibility', 'responsibility'],
                  ['STIGRef', 'stigref'],
                  ['Security Override Guidance', 'securityoverrideguidance'],
                  ['Severity Justification', 'severityjustification']
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
            title: {path: 'ruletitle'},
            id: {path: 'vulnnum'},
            desc: {path: 'vulndiscuss'},
            descriptions: [
              {
                data: {path: 'checkcontent'},
                label: 'check'
              },
              {
                data: {path: 'fixtext'},
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
          ...(this.withRaw && {raw: data.jsonixData})
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
