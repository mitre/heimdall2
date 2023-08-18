import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../../package.json';
import {Checklist} from '../../types/checklistJsonix';
import {
  BaseConverter,
  generateHash,
  ILookupPath,
  MappedTransform
} from '../base-converter';
import {CciNistMapping, CciNistTwoWayMapper} from '../mappings/CciNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from '../utils/global';
import {
  ChecklistJsonixConverter,
  ChecklistObject,
  ChecklistVuln,
  EmptyChecklistObject,
  updateChecklistWithMetadata
} from './checklist-jsonix-converter';
import * as checklistMapping from './jsonixMapping';

enum ImpactMapping {
  high = 0.7,
  medium = 0.5,
  low = 0.3
}

//const CCI_NIST_MAPPING = new CciNistMapping();
const CCI_NIST_TWO_WAY_MAPPER = new CciNistTwoWayMapper();

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
  return CCI_NIST_TWO_WAY_MAPPER.nistFilter(
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
      `Severity "${severity}" does not match low, medium, or high, please check severity for ${vuln.vulnNum}`
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

function checkMessage(typeCheck: string, messageType: string, message: string): string | null {
  if (typeCheck === messageType) {
    return message;
  } else {
    return null;
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

  for (const finding of findings) {
    // if the finding_details are empty
    if (!finding.code_desc) {
      results.push({
        status: finding.status,
        code_desc: finding.code_desc,
        start_time: finding.start_time
      });
    } else {
      // split into multiple findings details using heimdall2 CKLExport functionality
      for (const details of finding.code_desc.split(
        '\n--------------------------------\n'
      )) {
        // regex of four groups (five if you count the full match) consisting of the four possible status
        // followed by any number of characters after :: TEST which represents the code_desc
        // followed by an optionally :: MESSAGE or SKIP_MESSAGE representing the message type
        // followed by any number of characters representing the message
        const regex = /^(failed|passed|skipped|error)\s*::\s*TEST\s*(.*?)\s*(?:::\s*(MESSAGE|SKIP_MESSAGE)\s*(.*?))?$/s;
        // split details for status
        const match = regex.exec(details.trim());
        if (match) {
          const [, mStatus, mCode_dec, messageType, mMessage] = match;
          results.push({
            status: getStatus(mStatus),
            code_desc: mCode_dec,
            message: checkMessage("MESSAGE", messageType, mMessage),
            start_time: '',
            skip_message: checkMessage("SKIP_MESSAGE", messageType, mMessage),
          })
        }
      }
    }
  }
  return results;
}

function parseComments(input: unknown[]): ExecJSON.ControlDescription[] {
  console.log(input)
  const descriptions = input as unknown as ExecJSON.ControlDescription[];
  const results: ExecJSON.ControlDescription[] = [];

  for (const description of descriptions) {
    // if description_data is empty
    if (!description.data) {
      return results;
    } else {
      for (const section of description.data.split(/\n(?=[A-Z]+ ::)/)) {
        console.log(section, '????')
        const matches = RegExp(/([A-Z]+) :: (.+)/s).exec(section);
        console.log('matches ... ', matches)
        if (matches) {
          const [, label, data] = matches;
          if (data){
              results.push({data, label: label.toLowerCase()});
          }
        }
      }
    }
  }
  console.log(results);
  return results;
}

function containsChecklist(object: ExecJSON.Execution): boolean {
  return _.has(object, 'passthrough.checklist');
}

export function getChecklistObjectFromHdf(
  hdf: ExecJSON.Execution
): ChecklistObject {
  if (_.get(hdf, 'passthrough.metadata')) {
    return updateChecklistWithMetadata(hdf);
  }
  return _.get(hdf, 'passthrough.checklist', EmptyChecklistObject);
}

/**
 * ChecklistResults is a wrapper for ChecklistMapper using the intakeType
 *  default returns a single hdf object without any modifications
 *  split returns multiple hdf object based on number of iSTIG objects in checklist
 *  wrapper returns a single hdf object with an additional profile created using file name as profile name and adds parent_profile key to each mapped profile
 */
export class ChecklistResults extends ChecklistJsonixConverter {
  data: string | ExecJSON.Execution;
  jsonixData: Checklist;
  checklistObject: ChecklistObject;
  withRaw: boolean;

  /**
   * Creates instance of ChecklistResult object because ChecklistMapper uses the intermediate ChecklistObject to create HDF mapping
   * @param checklistXml - string of xml data
   */
  constructor(data: string | ExecJSON.Execution, withRaw = false) {
    super(checklistMapping.jsonixMapping);
    this.data = data;
    if (typeof data === 'string') {
      this.jsonixData = super.toJsonix(data);
      this.checklistObject = super.toIntermediateObject(this.jsonixData);
    } else {
      if (containsChecklist(data)) {
        this.checklistObject = getChecklistObjectFromHdf(data);
        this.jsonixData = super.fromIntermediateObject(this.checklistObject);
      } else {
        // CREATE Intermediate Object from HDF
        this.checklistObject = super.hdfToIntermediateObject(data);
        this.jsonixData = super.fromIntermediateObject(this.checklistObject);
      }
    }
    this.withRaw = withRaw;
  }

  getJsonix(): Checklist {
    return this.jsonixData;
  }

  toCkl(): string {
    return `<?xml version="1.0" encoding="UTF-8"?><!--Heimdall Version :: ${HeimdallToolsVersion}-->${super.fromJsonix(this.jsonixData)}`;
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
              gtitle: {path: 'groupTitle'},
              rid: {path: 'ruleId'},
              gid: {path: 'vulnNum'},
              stig_id: {path: 'ruleVer'},
              cci: {
                path: 'cciRef',
                transformer: cciRef
              },
              nist: {
                path: 'cciRef',
                transformer: nistTag
              },
              weight: {path: 'weight'},
              // following transform takes the available attributes found in a checklist vuln and if available will add to the tags.
              // first element is the label name as it will appear in UI while the second is the ChecklistObject keyname
              transformer: (input: ChecklistVuln): Record<string, unknown> => {
                const tags = [
                  ['IA_Controls', 'iaControls'],
                  ['Legacy_ID', 'legacyId'],
                  ['False_Positives', 'falsePositives'],
                  ['False_Negatives', 'falseNegatives'],
                  ['Mitigations', 'mitigations'],
                  ['Mitigation_Controls', 'mitigationControl'],
                  ['Potential_Impact', 'potentialImpact'],
                  ['Responsibility', 'responsibility'],
                  ['STIGRef', 'stigRef'],
                  ['Security_Override_Guidance', 'securityOverrideGuidance'],
                  ['Severity_Justification', 'severityJustification']
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
                arrayTransformer: parseComments,
                data: {path: 'comments'},
                label: ''
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
