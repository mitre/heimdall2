/**
 * Reads and parses inspec files
 */

import { InspecDataModule } from '@/store/data_store';
import Store from '@/store/store';
import {
  ChecklistAsset,
  ChecklistFile,
  StigHeader,
  ChecklistStig,
  ChecklistVuln
} from '@/types/checklist/control';
import { Tag } from '@/types/models';
import { read_file_async } from '@/utilities/async_util';
import {
  ASFFResults as ASFFResultsMapper,
  BurpSuiteMapper,
  ChecklistResults,
  ConveyorResults as ConveyorResultsMapper,
  DBProtectMapper,
  fingerprint,
  FortifyMapper,
  GoSecMapper,
  INPUT_TYPES,
  IonChannelMapper,
  JfrogXrayMapper,
  NessusResults,
  NetsparkerMapper,
  NiktoMapper,
  PrismaMapper,
  SarifMapper,
  ScoutsuiteMapper,
  SnykResults,
  TwistlockResults,
  VeracodeMapper,
  XCCDFResultsMapper,
  ZapMapper
} from '@mitre/hdf-converters';
import { Jsonix } from '@mitre/jsonix';
import axios from 'axios';
import {
  ContextualizedEvaluation,
  ContextualizedProfile,
  contextualizeEvaluation,
  contextualizeProfile,
  ConversionResult,
  convertFile,
  ExecJSON
} from 'inspecjs';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { Action, getModule, Module, VuexModule } from 'vuex-module-decorators';
import { FilteredDataModule } from './data_filters';
import { SnackbarModule } from './snackbar';

/** Each FileID corresponds to a unique File in this store */
export type FileID = string;

/** Represents the minimum data to represent an uploaded file handle. */
export type InspecFile = {
  /**
   * Unique identifier for this file. Used to encode which file is currently selected, etc.
   *
   * Note that in general one can assume that if a file A is loaded AFTER a file B, then
   * A.unique_id > B.unique_id.
   * Using this property, one might order files by order in which they were added.
   */
  uniqueId: FileID;
  /** The filename that this file was uploaded under. */
  filename: string;

  database_id?: number;

  tags?: Tag[];

  createdAt?: Date;
  updatedAt?: Date;
};

/** Modify our contextual types to sort of have back-linking to sourced from files */
export interface SourcedContextualizedEvaluation
  extends ContextualizedEvaluation {
  from_file: EvaluationFile;
}

export interface SourcedContextualizedProfile extends ContextualizedProfile {
  from_file: ProfileFile;
}

/** Represents a file containing an Inspec Execution output */
export type EvaluationFile = InspecFile & {
  evaluation: SourcedContextualizedEvaluation;
};

/** Represents a file containing an Inspec Profile (not run) */
export type ProfileFile = InspecFile & {
  profile: SourcedContextualizedProfile;
};

export type FileLoadOptions = {
  /** The file to load */
  file?: File;
  filename?: string;
  data?: string;
};

export type TextLoadOptions = {
  /** The filename to denote this object with */
  filename: string;
  database_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: Tag[];

  /** The text to use for it. */
  text: string;
};

export type ExecJSONLoadOptions = {
  /** The filename to denote this object with */
  filename: string;
  database_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: Tag[];
  data: ExecJSON.Execution;
};

export type ChecklistLoadOptions = {
  filename: string;
  database_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: Tag[];
  text: string;
};

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'intake'
})
export class InspecIntake extends VuexModule {
  /**
   * Load a file with the specified options. Promises an error message on failure
   */
  @Action
  async loadFile(options: FileLoadOptions): Promise<FileID | FileID[]> {
    let read: string;
    const filename =
      options.file?.name || options.filename || 'Missing Filename';
    if (options.file) {
      read = await read_file_async(options.file);
    } else if (options.data) {
      read = options.data;
    } else {
      throw Error('No file or data passed to report intake');
    }
    if (await this.isHDF(read)) {
      return this.loadText({
        text: read,
        filename: filename
      });
    } else if (await this.isChecklist(read)) {
      return this.loadChecklist({
        text: read,
        filename: filename
      });
    } else {
      const converted = await this.convertToHdf({
        fileOptions: options,
        data: read
      });
      if (Array.isArray(converted)) {
        const originalFileSplit = filename.split('.');
        // Default to .json if not found
        let originalFileType = '.json';
        if (originalFileSplit.length > 1) {
          originalFileType = originalFileSplit[originalFileSplit.length - 1];
        }
        return Promise.all(
          converted.map((evaluation) => {
            return this.loadExecJson({
              data: evaluation,
              filename: `${filename
                .replace(/.json/gi, '')
                .replace(/.nessus/gi, '')}-${_.get(
                  evaluation,
                  'platform.target_id'
                )}.${originalFileType}`
            });
          })
        );
      } else if (converted) {
        return this.loadExecJson({
          data: converted,
          filename: filename
        });
      } else {
        return [];
      }
    }
  }

  @Action
  async isChecklist(
    data: string | Record<string, unknown> | undefined
  ): Promise<boolean> {
    if (
      typeof data === 'string' &&
      data.toLowerCase().includes('<checklist>')
    ) {
      return true;
    }
    return false;
  }

  @Action
  async isHDF(
    data: string | Record<string, unknown> | undefined
  ): Promise<boolean> {
    if (typeof data === 'string') {
      try {
        // If our data loads correctly it could be HDF
        const parsed = JSON.parse(data);
        return (
          Array.isArray(parsed.profiles) || // Execution JSON
          (Boolean(parsed.controls) && Boolean(parsed.sha256)) // Profile JSON
        );
      } catch {
        // HDF isn't valid json, we have a different format
        return false;
      }
    } else if (typeof data === 'object') {
      return (
        Array.isArray(data.profiles) || // Execution JSON
        (Boolean(data.controls) && Boolean(data.sha256)) // Profile JSON
      );
    } else if (typeof data === 'undefined') {
      SnackbarModule.failure('Missing data to convert to validate HDF');
      return false;
    } else {
      SnackbarModule.failure('Unknown file data type');
      return false;
    }
  }

  @Action
  async convertToHdf(convertOptions: {
    fileOptions: FileLoadOptions;
    data: string;
  }): Promise<ExecJSON.Execution | ExecJSON.Execution[] | void> {
    const filename =
      convertOptions.fileOptions.file?.name ||
      convertOptions.fileOptions.filename ||
      'No Filename';
    // If the data passed is valid json, try to match up known keys
    const typeGuess = fingerprint({
      data: convertOptions.data,
      filename: filename
    });
    switch (typeGuess) {
      case INPUT_TYPES.JFROG:
        return new JfrogXrayMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.ASFF:
        return Object.values(
          new ASFFResultsMapper(convertOptions.data).toHdf()
        );
      case INPUT_TYPES.CONVEYOR:
        return Object.values(
          new ConveyorResultsMapper(convertOptions.data).toHdf()
        );
      case INPUT_TYPES.ZAP:
        return new ZapMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.NIKTO:
        return new NiktoMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.SARIF:
        return new SarifMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.SNYK:
        return new SnykResults(convertOptions.data).toHdf();
      case INPUT_TYPES.TWISTLOCK:
        return new TwistlockResults(convertOptions.data).toHdf();
      case INPUT_TYPES.NESSUS:
        return new NessusResults(convertOptions.data).toHdf();
      case INPUT_TYPES.XCCDF:
        return new XCCDFResultsMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.BURP:
        return new BurpSuiteMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.IONCHANNEL:
        return new IonChannelMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.SCOUTSUITE:
        return new ScoutsuiteMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.DB_PROTECT:
        return new DBProtectMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.NETSPARKER:
        return new NetsparkerMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.PRISMA:
        return new PrismaMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.VERACODE:
        return new VeracodeMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.FORTIFY:
        return new FortifyMapper(convertOptions.data).toHdf();
      case INPUT_TYPES.CHECKLIST:
        return new ChecklistResults(convertOptions.data).toHdf();
      case INPUT_TYPES.GOSEC:
        return new GoSecMapper(convertOptions.data).toHdf();
      default:
        return SnackbarModule.failure(
          `Invalid file uploaded (${filename}), no fingerprints matched.`
        );
    }
  }

  @Action
  async detectAndLoadPredefinedJSON() {
    // On page load, check for the flag to load the preloaded JSON file
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.get('predefinedLoad')?.toLowerCase() === 'true') {
      return axios
        .get('/dynamic/predefinedload.json', {
          headers: {
            Accept: 'application/json'
          }
        })
        .then(async ({ data }) => {
          data.forEach(async (file: { filename: string; data: string }) => {
            InspecIntakeModule.loadFile({
              file: new File([new Blob([file.data])], file.filename)
            });
          });
          return true;
        })
        .catch((error) => {
          SnackbarModule.failure(
            `An error ocurred while loading your pre-defined file: ${error}`
          );
          return false;
        });
    } else {
      return false;
    }
  }

  @Action
  async loadText(options: TextLoadOptions): Promise<FileID> {
    // Convert it
    const fileID: FileID = uuid();
    const result: ConversionResult = convertFile(options.text, true);
    // Determine what sort of file we (hopefully) have, then add it
    if (result['1_0_ExecJson']) {
      // A bit of chicken and egg here
      const evalFile = {
        uniqueId: fileID,
        filename: options.filename,
        database_id: options.database_id,
        createdAt: options.createdAt,
        updatedAt: options.updatedAt,
        tags: options.tags
        // evaluation
      } as EvaluationFile;

      // Fixup the evaluation to be Sourced from a file. Requires a temporary type break
      const evaluation = contextualizeEvaluation(
        result['1_0_ExecJson']
      ) as unknown as SourcedContextualizedEvaluation;
      evaluation.from_file = evalFile;

      // Set and freeze
      evalFile.evaluation = evaluation;
      Object.freeze(evaluation);
      InspecDataModule.addExecution(evalFile);
      FilteredDataModule.toggle_evaluation(evalFile.uniqueId);
    } else if (result['1_0_ProfileJson']) {
      // Handle as profile
      const profileFile = {
        uniqueId: fileID,
        filename: options.filename
      } as ProfileFile;

      // Fixup the evaluation to be Sourced from a file. Requires a temporary type break
      const profile = contextualizeProfile(
        result['1_0_ProfileJson']
      ) as unknown as SourcedContextualizedProfile;
      profile.from_file = profileFile;

      // Set and freeze
      profileFile.profile = profile;
      Object.freeze(profile);
      InspecDataModule.addProfile(profileFile);
      FilteredDataModule.toggle_profile(profileFile.uniqueId);
    } else {
      // eslint-disable-next-line no-console
      console.error(result.errors);
      throw new Error(
        "Couldn't parse data. See developer's tools for more details."
      );
    }
    return fileID;
  }

  // Instead of re-stringifying converted evaluations, add the allow loading the ExecJSON directly.
  @Action
  async loadExecJson(options: ExecJSONLoadOptions) {
    // Convert it
    const fileID: FileID = uuid();
    // A bit of chicken and egg here, this will be our circular JSON structure
    const evalFile = {
      uniqueId: fileID,
      filename: options.filename,
      database_id: options.database_id,
      createdAt: options.createdAt,
      updatedAt: options.updatedAt,
      tags: options.tags
    } as EvaluationFile;

    // Fixup the evaluation to be Sourced from a file.
    const evaluation = contextualizeEvaluation(
      options.data
    ) as SourcedContextualizedEvaluation;
    evaluation.from_file = evalFile;

    // Set and freeze
    evalFile.evaluation = evaluation;
    Object.freeze(evaluation);
    InspecDataModule.addExecution(evalFile);
    FilteredDataModule.toggle_evaluation(evalFile.uniqueId);

    return fileID;
  }

  @Action
  async loadChecklist(options: ChecklistLoadOptions) {
    const fileID: FileID = uuid();

    function getAttributeData(stigdata: unknown[], tag: string): string {
      const results = stigdata.filter((attribute: unknown) => {
        return _.get(attribute, 'vulnattribute') === tag;
      });
      if (results.length === 1) {
        return _.get(results[0], 'attributedata');
      } else {
        return results
          .map((result: unknown) => _.get(result, 'attributedata'))
          .join('; ');
      }
    }

    function getSiData(stiginfo: unknown[], tag: string): string {
      const results = stiginfo.filter((attribute: unknown) => {
        return _.get(attribute, 'sidname') === tag;
      });
      if (results.length === 1) {
        return _.get(results[0], 'siddata');
      } else {
        return results
          .map((result: unknown) => _.get(result, 'siddata'))
          .join('; ');
      }
    }

    const raw = convertChecklist(options.text);

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

    const rawStigs: unknown[] = _.get(raw, 'value.stigs.istig');
    const stigs: ChecklistStig[] = [];

    rawStigs.forEach((stig: unknown) => {
      const stigInfo = _.get(stig, 'stiginfo.sidata');
      const header: StigHeader = {
        version: getSiData(stigInfo, 'version'),
        classification: getSiData(stigInfo, 'classification'),
        customname: getSiData(stigInfo, 'customname'),
        stigid: getSiData(stigInfo, 'stigid'),
        description: getSiData(stigInfo, 'description'),
        filename: getSiData(stigInfo, 'filename'),
        releaseinfo: getSiData(stigInfo, 'releaseinfo'),
        title: getSiData(stigInfo, 'title'),
        uuid: getSiData(stigInfo, 'uuid'),
        notice: getSiData(stigInfo, 'notice'),
        source: getSiData(stigInfo, 'source')
      };

      const checklistVulns: ChecklistVuln[] = [];
      const vulns: unknown[] = _.get(stig, 'vuln');
      vulns.forEach((vuln: unknown) => {
        const stigdata: unknown[] = _.get(vuln, 'stigdata');
        const checklistVuln: ChecklistVuln = {
          status: _.get(vuln, 'status'),
          findingDetails: _.get(vuln, 'findingdetails'),
          comments: _.get(vuln, 'comments'),
          severityOverride: _.get(vuln, 'severityoverride'),
          severityJustification: _.get(vuln, 'severityjustification'),
          vulnNum: getAttributeData(stigdata, 'Vuln_Num'),
          severity: getAttributeData(stigdata, 'Severity'),
          groupTitle: getAttributeData(stigdata, 'Group_Title'),
          ruleId: getAttributeData(stigdata, 'Rule_ID'),
          ruleVersion: getAttributeData(stigdata, 'Rule_Ver'),
          ruleTitle: getAttributeData(stigdata, 'Rule_Title'),
          vulnDiscuss: getAttributeData(stigdata, 'Vuln_Discuss'),
          iaControls: getAttributeData(stigdata, 'IA_Controls'),
          checkContent: getAttributeData(stigdata, 'Check_Content'),
          fixText: getAttributeData(stigdata, 'Fix_Text'),
          falsePositives: getAttributeData(stigdata, 'False_Positives'),
          falseNegatives: getAttributeData(stigdata, 'False_Negatives'),
          documentable: getAttributeData(stigdata, 'Documentable'),
          mitigations: getAttributeData(stigdata, 'Mitigations'),
          potentialImpact: getAttributeData(stigdata, 'Potential_Impact'),
          thirdPartyTools: getAttributeData(stigdata, 'Third_Party_Tools'),
          mitigationControl: getAttributeData(stigdata, 'Mitigation_Control'),
          responsibility: getAttributeData(stigdata, 'Responsibility'),
          securityOverrideGuidance: getAttributeData(
            stigdata,
            'Security_Override_Guidance'
          ),
          checkContentRef: getAttributeData(stigdata, 'Check_Content_Ref'),
          weight: getAttributeData(stigdata, 'Weight'),
          class: getAttributeData(stigdata, 'Class'),
          stigRef: getAttributeData(stigdata, 'STIGRef'),
          targetKey: getAttributeData(stigdata, 'TargetKey'),
          stigUuid: getAttributeData(stigdata, 'STIG_UUID'),
          legacyId: getAttributeData(stigdata, 'LEGACY_ID'),
          cciRef: getAttributeData(stigdata, 'CCI_REF')
        };
        checklistVulns.push(checklistVuln);
      });

      stigs.push({
        header: header,
        vulns: checklistVulns
      });
    });

    const newChecklist: ChecklistFile = {
      uniqueId: fileID,
      filename: options.filename,
      asset: asset,
      stigs: stigs,
      raw: raw
    };

    InspecDataModule.addChecklist(newChecklist);
    FilteredDataModule.toggle_checklist(newChecklist.uniqueId);

    return fileID;
  }
}

function convertChecklist(text: string): Object {
  /** Mapping from checklist XSD schema to JS object
   *  (Generated by jsonix-schema-compiler)
   */
  const mapping = {
    name: 'mapping',
    typeInfos: [
      {
        localName: 'STIGDATA',
        typeName: null,
        propertyInfos: [
          {
            name: 'vulnattribute',
            required: true,
            elementName: {
              localPart: 'VULN_ATTRIBUTE'
            },
            values: [
              'CCI_REF',
              'Check_Content',
              'Check_Content_Ref',
              'Class',
              'Documentable',
              'False_Negatives',
              'False_Positives',
              'Fix_Text',
              'Group_Title',
              'IA_Controls',
              'Mitigation_Control',
              'Mitigations',
              'Potential_Impact',
              'Responsibility',
              'Rule_ID',
              'Rule_Title',
              'Rule_Ver',
              'STIGRef',
              'Security_Override_Guidance',
              'Severity',
              'Third_Party_Tools',
              'Vuln_Discuss',
              'Vuln_Num',
              'Weight',
              'TargetKey',
              'STIG_UUID',
              'LEGACY_ID'
            ]
          },
          {
            name: 'attributedata',
            required: true,
            elementName: {
              localPart: 'ATTRIBUTE_DATA'
            }
          }
        ]
      },
      {
        localName: 'ASSET',
        typeName: null,
        propertyInfos: [
          {
            name: 'role',
            required: true,
            elementName: {
              localPart: 'ROLE'
            },
            values: [
              'None',
              'Workstation',
              'Member Server',
              'Domain Controller'
            ]
          },
          {
            name: 'assettype',
            required: true,
            elementName: {
              localPart: 'ASSET_TYPE'
            },
            values: ['Computing', 'Non-Computing']
          },
          {
            name: 'marking',
            elementName: {
              localPart: 'MARKING'
            }
          },
          {
            name: 'hostname',
            required: true,
            elementName: {
              localPart: 'HOST_NAME'
            }
          },
          {
            name: 'hostip',
            required: true,
            elementName: {
              localPart: 'HOST_IP'
            }
          },
          {
            name: 'hostmac',
            required: true,
            elementName: {
              localPart: 'HOST_MAC'
            }
          },
          {
            name: 'hostguid',
            elementName: {
              localPart: 'HOST_GUID'
            }
          },
          {
            name: 'hostfqdn',
            required: true,
            elementName: {
              localPart: 'HOST_FQDN'
            }
          },
          {
            name: 'targetcomment',
            elementName: {
              localPart: 'TARGET_COMMENT'
            }
          },
          {
            name: 'techarea',
            required: true,
            elementName: {
              localPart: 'TECH_AREA'
            },
            values: [
              '',
              'Application Review',
              'Boundary Security',
              'CDS Admin Review',
              'CDS Technical Review',
              'Database Review',
              'Domain Name System (DNS)',
              'Exchange Server',
              'Host Based System Security (HBSS)',
              'Internal Network',
              'Mobility',
              'Releasable Networks (REL)',
              'Releaseable Networks (REL)',
              'Traditional Security',
              'UNIX OS',
              'VVOIP Review',
              'Web Review',
              'Windows OS',
              'Other Review'
            ]
          },
          {
            name: 'targetkey',
            required: true,
            elementName: {
              localPart: 'TARGET_KEY'
            }
          },
          {
            name: 'stigguid',
            elementName: {
              localPart: 'STIG_GUID'
            }
          },
          {
            name: 'webordatabase',
            required: true,
            elementName: {
              localPart: 'WEB_OR_DATABASE'
            },
            typeInfo: 'Boolean'
          },
          {
            name: 'webdbsite',
            required: true,
            elementName: {
              localPart: 'WEB_DB_SITE'
            }
          },
          {
            name: 'webdbinstance',
            required: true,
            elementName: {
              localPart: 'WEB_DB_INSTANCE'
            }
          }
        ]
      },
      {
        localName: 'SIDATA',
        typeName: null,
        propertyInfos: [
          {
            name: 'sidname',
            required: true,
            elementName: {
              localPart: 'SID_NAME'
            },
            values: [
              'classification',
              'customname',
              'description',
              'filename',
              'notice',
              'releaseinfo',
              'source',
              'stigid',
              'title',
              'uuid',
              'version'
            ]
          },
          {
            name: 'siddata',
            elementName: {
              localPart: 'SID_DATA'
            }
          }
        ]
      },
      {
        localName: 'STIGS',
        typeName: null,
        propertyInfos: [
          {
            name: 'istig',
            required: true,
            collection: true,
            elementName: {
              localPart: 'iSTIG'
            },
            typeInfo: '.ISTIG'
          }
        ]
      },
      {
        localName: 'STIGINFO',
        typeName: null,
        propertyInfos: [
          {
            name: 'sidata',
            required: true,
            collection: true,
            elementName: {
              localPart: 'SI_DATA'
            },
            typeInfo: '.SIDATA'
          }
        ]
      },
      {
        localName: 'CHECKLIST',
        typeName: null,
        propertyInfos: [
          {
            name: 'asset',
            required: true,
            elementName: {
              localPart: 'ASSET'
            },
            typeInfo: '.ASSET'
          },
          {
            name: 'stigs',
            required: true,
            elementName: {
              localPart: 'STIGS'
            },
            typeInfo: '.STIGS'
          }
        ]
      },
      {
        localName: 'VULN',
        typeName: null,
        propertyInfos: [
          {
            name: 'stigdata',
            required: true,
            collection: true,
            elementName: {
              localPart: 'STIG_DATA'
            },
            typeInfo: '.STIGDATA'
          },
          {
            name: 'status',
            required: true,
            elementName: {
              localPart: 'STATUS'
            },
            values: ['NotAFinding', 'Open', 'Not_Applicable', 'Not_Reviewed']
          },
          {
            name: 'findingdetails',
            required: true,
            elementName: {
              localPart: 'FINDING_DETAILS'
            }
          },
          {
            name: 'comments',
            required: true,
            elementName: {
              localPart: 'COMMENTS'
            }
          },
          {
            name: 'severityoverride',
            required: true,
            elementName: {
              localPart: 'SEVERITY_OVERRIDE'
            },
            values: ['', 'low', 'medium', 'high']
          },
          {
            name: 'severityjustification',
            required: true,
            elementName: {
              localPart: 'SEVERITY_JUSTIFICATION'
            }
          }
        ]
      },
      {
        localName: 'ISTIG',
        typeName: null,
        propertyInfos: [
          {
            name: 'stiginfo',
            required: true,
            elementName: {
              localPart: 'STIG_INFO'
            },
            typeInfo: '.STIGINFO'
          },
          {
            name: 'vuln',
            required: true,
            collection: true,
            elementName: {
              localPart: 'VULN'
            },
            typeInfo: '.VULN'
          }
        ]
      }
    ],
    elementInfos: [
      {
        elementName: {
          localPart: 'WEB_DB_INSTANCE'
        }
      },
      {
        elementName: {
          localPart: 'TARGET_KEY'
        }
      },
      {
        values: ['None', 'Workstation', 'Member Server', 'Domain Controller'],
        elementName: {
          localPart: 'ROLE'
        }
      },
      {
        elementName: {
          localPart: 'MARKING'
        }
      },
      {
        values: [
          'classification',
          'customname',
          'description',
          'filename',
          'notice',
          'releaseinfo',
          'source',
          'stigid',
          'title',
          'uuid',
          'version'
        ],
        elementName: {
          localPart: 'SID_NAME'
        }
      },
      {
        elementName: {
          localPart: 'HOST_NAME'
        }
      },
      {
        values: ['', 'low', 'medium', 'high'],
        elementName: {
          localPart: 'SEVERITY_OVERRIDE'
        }
      },
      {
        elementName: {
          localPart: 'HOST_FQDN'
        }
      },
      {
        elementName: {
          localPart: 'FINDING_DETAILS'
        }
      },
      {
        elementName: {
          localPart: 'SEVERITY_JUSTIFICATION'
        }
      },
      {
        typeInfo: '.STIGDATA',
        elementName: {
          localPart: 'STIG_DATA'
        }
      },
      {
        elementName: {
          localPart: 'HOST_MAC'
        }
      },
      {
        elementName: {
          localPart: 'HOST_GUID'
        }
      },
      {
        values: ['NotAFinding', 'Open', 'Not_Applicable', 'Not_Reviewed'],
        elementName: {
          localPart: 'STATUS'
        }
      },
      {
        elementName: {
          localPart: 'COMMENTS'
        }
      },
      {
        typeInfo: '.VULN',
        elementName: {
          localPart: 'VULN'
        }
      },
      {
        typeInfo: '.STIGINFO',
        elementName: {
          localPart: 'STIG_INFO'
        }
      },
      {
        typeInfo: '.ASSET',
        elementName: {
          localPart: 'ASSET'
        }
      },
      {
        typeInfo: '.CHECKLIST',
        elementName: {
          localPart: 'CHECKLIST'
        }
      },
      {
        typeInfo: '.ISTIG',
        elementName: {
          localPart: 'iSTIG'
        }
      },
      {
        elementName: {
          localPart: 'HOST_IP'
        }
      },
      {
        elementName: {
          localPart: 'STIG_GUID'
        }
      },
      {
        typeInfo: 'Boolean',
        elementName: {
          localPart: 'WEB_OR_DATABASE'
        }
      },
      {
        elementName: {
          localPart: 'SID_DATA'
        }
      },
      {
        values: [
          '',
          'Application Review',
          'Boundary Security',
          'CDS Admin Review',
          'CDS Technical Review',
          'Database Review',
          'Domain Name System (DNS)',
          'Exchange Server',
          'Host Based System Security (HBSS)',
          'Internal Network',
          'Mobility',
          'Releasable Networks (REL)',
          'Releaseable Networks (REL)',
          'Traditional Security',
          'UNIX OS',
          'VVOIP Review',
          'Web Review',
          'Windows OS',
          'Other Review'
        ],
        elementName: {
          localPart: 'TECH_AREA'
        }
      },
      {
        elementName: {
          localPart: 'ATTRIBUTE_DATA'
        }
      },
      {
        values: ['Computing', 'Non-Computing'],
        elementName: {
          localPart: 'ASSET_TYPE'
        }
      },
      {
        values: [
          'CCI_REF',
          'Check_Content',
          'Check_Content_Ref',
          'Class',
          'Documentable',
          'False_Negatives',
          'False_Positives',
          'Fix_Text',
          'Group_Title',
          'IA_Controls',
          'Mitigation_Control',
          'Mitigations',
          'Potential_Impact',
          'Responsibility',
          'Rule_ID',
          'Rule_Title',
          'Rule_Ver',
          'STIGRef',
          'Security_Override_Guidance',
          'Severity',
          'Third_Party_Tools',
          'Vuln_Discuss',
          'Vuln_Num',
          'Weight',
          'TargetKey',
          'STIG_UUID',
          'LEGACY_ID'
        ],
        elementName: {
          localPart: 'VULN_ATTRIBUTE'
        }
      },
      {
        elementName: {
          localPart: 'TARGET_COMMENT'
        }
      },
      {
        typeInfo: '.SIDATA',
        elementName: {
          localPart: 'SI_DATA'
        }
      },
      {
        elementName: {
          localPart: 'WEB_DB_SITE'
        }
      },
      {
        typeInfo: '.STIGS',
        elementName: {
          localPart: 'STIGS'
        }
      }
    ]
  };

  const context = new Jsonix.Context([mapping]);
  const unmarshaller = context.createUnmarshaller();

  return unmarshaller.unmarshalString(text);
}

export const InspecIntakeModule = getModule(InspecIntake);
