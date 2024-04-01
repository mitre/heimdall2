import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import xmlFormat from 'xml-formatter';
import {version as HeimdallToolsVersion} from '../../package.json';
import {
  BaseConverter,
  generateHash,
  ILookupPath,
  MappedTransform
} from '../base-converter';
import {CciNistTwoWayMapper} from '../mappings/CciNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from '../utils/global';
import {
  ChecklistJsonixConverter,
  ChecklistObject,
  ChecklistVuln,
  EmptyChecklistObject,
  updateChecklistWithMetadata
} from './checklist-jsonix-converter';
import {Checklist} from './checklistJsonix';
import {jsonixMapping} from './jsonixMapping';

enum ImpactMapping {
  high = 0.7,
  medium = 0.5,
  low = 0.3
}

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

function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Transformer function that checks if the status is 'Not Applicable' returning a 0.
 * Otherwise, maps severity to ImpactMapping
 * @param vuln - checklist vulnerability object
 * @returns impact - number 0.3, 0.5, or 0.7
 */
function transformImpact(vuln: ChecklistVuln): number {
  if (vuln.status === 'Not Applicable') return 0.0;
  let impact =
    ImpactMapping[
      findSeverity(vuln).toLowerCase() as keyof typeof ImpactMapping
    ];
  if (isJsonString(vuln.thirdPartyTools)) {
    const hdfExistingData = JSON.parse(vuln.thirdPartyTools);
    impact = _.get(
      hdfExistingData,
      'hdfSpecificData.impact',
      ImpactMapping[
        findSeverity(vuln).toLowerCase() as keyof typeof ImpactMapping
      ]
    );
  }
  if (!impact)
    throw new Error(
      `Severity "${findSeverity(
        vuln
      )}" does not match low, medium, or high, please check severity for ${
        vuln.vulnNum
      }`
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

function checkMessage(
  typeCheck: string,
  messageType: string,
  message: string
): string | null {
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
  const findingDetails = findings[0].code_desc;
  const regex =
    /^(failed|passed|skipped|error) :: TEST (.*?)(?: :: (MESSAGE|SKIP_MESSAGE) (.*?))?$/s;

  // check if code_desc is empty or does not match the above regular expression
  if (!RegExp(regex).exec(findingDetails)) {
    return [
      {
        status: findings[0].status,
        code_desc: findings[0].code_desc,
        start_time: ''
      }
    ];
  } else {
    // split into multiple findings details using heimdall2 CKLExport functionality
    for (const details of findingDetails.split(
      '\n--------------------------------\n'
    )) {
      // regex of four groups (five if you count the full match) consisting of the four possible status
      // followed by any number of characters after :: TEST which represents the code_desc
      // followed by an optionally :: MESSAGE or SKIP_MESSAGE representing the message type
      // followed by any number of characters representing the message
      // split details for status
      const match = regex.exec(details.trim());
      if (match) {
        const [, mStatus, mCode_dec, messageType, mMessage] = match;
        results.push({
          status: getStatus(mStatus),
          code_desc: mCode_dec,
          message: checkMessage('MESSAGE', messageType, mMessage),
          start_time: '',
          skip_message: checkMessage('SKIP_MESSAGE', messageType, mMessage)
        });
      }
    }
  }
  return results;
}

function parseComments(input: unknown[]): ExecJSON.ControlDescription[] {
  const descriptions = input as unknown as ExecJSON.ControlDescription[];
  const results: ExecJSON.ControlDescription[] = [];
  const commentString = descriptions[0].data;
  if (!commentString) {
    return results;
  } else if (!commentString.includes(' :: ')) {
    return [
      {
        label: descriptions[0].label,
        data: descriptions[0].data
      }
    ];
  } else {
    for (const section of commentString.split(/\n(?=[A-Z]+ ::)/)) {
      const matches = RegExp(/([A-Z]+) :: (.+)/s).exec(section);
      if (matches) {
        const [, label, data] = matches;
        if (data) {
          results.push({data, label: label.toLowerCase()});
        }
      }
    }
  }
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

// baseconverter makes it difficult to assign an array to attributes using just path+transformer in this case because i think it gets instantly redirected along the 'isString' pathway due to the path pointing at a stringified json blob
// consequently we have to use the arraytransformer, but that doesn't run if we provide a path at the top level of the object for the same reason as specified above, so we have to put the 'hdfSpecificData' object into the subobject 'data'
// which we can then extract here
function getAttributes(input: unknown[]) {
  const passthrough = input as unknown as [{data: string}];
  const data = passthrough[0].data;
  if (!data) {
    return [];
  } else {
    return JSON.parse(data).hdfSpecificData?.attributes || [];
  }
}

function getHdfSpecificDataAttribute(
  attribute: string,
  input: string
): {[key: string]: any}[] | string | undefined {
  let data;
  if (
    !input ||
    !isJsonString(input) ||
    !_.isObject((data = JSON.parse(input)).hdfSpecificData)
  ) {
    return undefined;
  }

  return data.hdfSpecificData[attribute] || undefined;
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
    super(jsonixMapping);
    this.data = data;
    if (typeof data === 'string') {
      this.jsonixData = super.toJsonix(data);
      this.checklistObject = super.toIntermediateObject(this.jsonixData);
    } else if (containsChecklist(data)) {
      this.checklistObject = getChecklistObjectFromHdf(data);
      this.jsonixData = super.fromIntermediateObject(this.checklistObject);
    } else {
      // CREATE Intermediate Object from HDF
      this.checklistObject = super.hdfToIntermediateObject(data);
      this.jsonixData = super.fromIntermediateObject(this.checklistObject);
    }
    this.withRaw = withRaw;
  }

  getJsonix(): Checklist {
    return this.jsonixData;
  }

  toCkl(): string {
    return xmlFormat(
      `<?xml version="1.0" encoding="UTF-8"?><!--Heimdall Version :: ${HeimdallToolsVersion}-->${super.fromJsonix(
        this.jsonixData
      )}`,
      {lineSeparator: '\n', collapseContent: true, indentation: '\t'}
    );
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
        name: {path: 'header.stigid'},
        version: {
          path: 'header',
          transformer: (input) => {
            const ret =
              getHdfSpecificDataAttribute('version', input.customname) ||
              input.version;
            return ret;
          }
        },
        title: {path: 'header.title'},
        maintainer: {
          path: 'header.customname',
          transformer: _.partial(getHdfSpecificDataAttribute, 'maintainer')
        },
        summary: {path: 'header.description'},
        license: {path: 'header.notice'},
        copyright: {
          path: 'header.customname',
          transformer: _.partial(getHdfSpecificDataAttribute, 'copyright')
        },
        copyright_email: {
          path: 'header.customname',
          transformer: _.partial(getHdfSpecificDataAttribute, 'copyright_email')
        },
        supports: [],
        attributes: [
          {
            arrayTransformer: getAttributes,
            data: {path: 'header.customname'}
          }
        ],
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
                label: 'comments'
              }
            ],
            impact: {
              transformer: (vulnerability: ChecklistVuln): number =>
                transformImpact(vulnerability)
            },
            code: {
              transformer: (vulnerability: ChecklistVuln): string => {
                if (isJsonString(vulnerability.thirdPartyTools)) {
                  return JSON.parse(vulnerability.thirdPartyTools)
                    .hdfSpecificData?.code;
                }
                return JSON.stringify(vulnerability, null, 2);
              }
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

  constructor(checklistObject: ChecklistObject, withRaw = false) {
    super(checklistObject);
    this.withRaw = withRaw;
  }
}
