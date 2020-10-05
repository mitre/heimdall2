/**
 * Reads and parses inspec files
 */

import {parse, context} from 'inspecjs';
import {Module, VuexModule, getModule, Action} from 'vuex-module-decorators';
import {InspecDataModule} from '@/store/data_store';
import Store from '@/store/store';
import {read_file_async} from '@/utilities/async_util';
import {Tag} from '@/types/models.ts';

import {v4 as uuid} from 'uuid';
import {FilteredDataModule} from './data_filters';

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
  unique_id: FileID;
  /** The filename that this file was uploaded under. */
  filename: string;

  database_id?: number;

  tags?: Tag[];

  createdAt?: Date;
  updatedAt?: Date;
};

/** Modify our contextual types to sort of have back-linking to sourced from files */
export interface SourcedContextualizedEvaluation
  extends context.ContextualizedEvaluation {
  from_file: EvaluationFile;
}

export interface SourcedContextualizedProfile
  extends context.ContextualizedProfile {
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
  file: File;
};

export type TextLoadOptions = {
  /** The filename to denote this object with */
  filename: string;

  database_id?: number;

  createdAt?: Date;
  updatedAt?: Date;

  tags?: Tag[];

  /** The text to use for it. */
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
  @Action({rawError: true})
  async loadFile(options: FileLoadOptions): Promise<FileID> {
    let read = read_file_async(options.file);
    return read.then(text =>
      this.loadText({
        text,
        filename: options.file.name
      })
    );
  }

  @Action({rawError: true})
  async loadText(options: TextLoadOptions): Promise<FileID> {
    // Convert it
    const fileID: FileID = uuid();
    const result: parse.ConversionResult = parse.convertFile(options.text);

    // Determine what sort of file we (hopefully) have, then add it
    if (result['1_0_ExecJson']) {
      // A bit of chicken and egg here
      let eval_file = {
        unique_id: fileID,
        filename: options.filename,
        database_id: options.database_id,
        createdAt: options.createdAt,
        updatedAt: options.updatedAt,
        tags: options.tags
        // evaluation
      } as EvaluationFile;

      // Fixup the evaluation to be Sourced from a file. Requires a temporary type break
      let evaluation = (context.contextualizeEvaluation(
        result['1_0_ExecJson']
      ) as unknown) as SourcedContextualizedEvaluation;
      evaluation.from_file = eval_file;

      // Set and freeze
      eval_file.evaluation = evaluation;
      Object.freeze(evaluation);
      InspecDataModule.addExecution(eval_file);
      FilteredDataModule.toggle_evaluation(eval_file.unique_id);
    } else if (result['1_0_ProfileJson']) {
      // Handle as profile
      let profile_file = {
        unique_id: fileID,
        filename: options.filename
      } as ProfileFile;

      // Fixup the evaluation to be Sourced from a file. Requires a temporary type break
      let profile = (context.contextualizeProfile(
        result['1_0_ProfileJson']
      ) as unknown) as SourcedContextualizedProfile;
      profile.from_file = profile_file;

      // Set and freeze
      profile_file.profile = profile;
      Object.freeze(profile);
      InspecDataModule.addProfile(profile_file);
      FilteredDataModule.toggle_profile(profile_file.unique_id);
    } else {
      throw new Error("Couldn't parse data");
    }
    return fileID;
  }
}

export const InspecIntakeModule = getModule(InspecIntake);
