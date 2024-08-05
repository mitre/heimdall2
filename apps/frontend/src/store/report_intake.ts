/**
 * Reads and parses inspec files
 */

import {InspecDataModule} from '@/store/data_store';
import Store from '@/store/store';
import {Tag} from '@/types/models';
import {read_file_async} from '@/utilities/async_util';
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
import * as _ from 'lodash';
import {v4 as uuid} from 'uuid';
import {Action, getModule, Module, VuexModule} from 'vuex-module-decorators';
import {FilteredDataModule} from './data_filters';
import {SnackbarModule} from './snackbar';
import selectedTags from '@/store/selected_tags';

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
        .then(async ({data}) => {
          data.forEach(async (file: {filename: string; data: string}) => {
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
    const fileID: FileID = uuid();
    const result: ConversionResult = convertFile(options.text, true);
    // Get the checkedValues from the selectedTags module
    const checkedValues = Store.getters['selectedTags/checkedValues'];
    if (result['1_0_ExecJson']) {
      const evalFile = {
        uniqueId: fileID,
        filename: options.filename,
        database_id: options.database_id,
        createdAt: options.createdAt,
        updatedAt: options.updatedAt,
        tags: options.tags
      } as EvaluationFile;
      const evaluation = contextualizeEvaluation(result['1_0_ExecJson'], checkedValues) as SourcedContextualizedEvaluation;
      evaluation.from_file = evalFile;
      evalFile.evaluation = evaluation;
      Object.freeze(evaluation);
      InspecDataModule.addExecution(evalFile);
      FilteredDataModule.toggle_evaluation(evalFile.uniqueId);
    } else if (result['1_0_ProfileJson']) {
      const profileFile = {
        uniqueId: fileID,
        filename: options.filename
      } as ProfileFile;
      const profile = contextualizeProfile(result['1_0_ProfileJson'], checkedValues) as SourcedContextualizedProfile;
      profile.from_file = profileFile;
      profileFile.profile = profile;
      Object.freeze(profile);
      InspecDataModule.addProfile(profileFile);
      FilteredDataModule.toggle_profile(profileFile.uniqueId);
    } else {
      console.error(result.errors);
      throw new Error("Couldn't parse data. See developer's tools for more details.");
    }
    return fileID;
  }
  @Action
  async loadExecJson(options: ExecJSONLoadOptions) {
    const fileID: FileID = uuid();
    // Get the checkedValues from the selectedTags module
    const checkedValues = Store.getters['selectedTags/checkedValues'];
    console.log(checkedValues)
    const evalFile = {
      uniqueId: fileID,
      filename: options.filename,
      database_id: options.database_id,
      createdAt: options.createdAt,
      updatedAt: options.updatedAt,
      tags: options.tags
    } as EvaluationFile;
    const evaluation = contextualizeEvaluation(options.data, checkedValues) as SourcedContextualizedEvaluation;
    evaluation.from_file = evalFile;
    evalFile.evaluation = evaluation;
    Object.freeze(evaluation);
    InspecDataModule.addExecution(evalFile);
    FilteredDataModule.toggle_evaluation(evalFile.uniqueId);
    return fileID;
  }
}

export const InspecIntakeModule = getModule(InspecIntake);
