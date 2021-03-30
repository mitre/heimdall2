/**
 * Tracks uploaded files, and their parsed contents
 */

import {
  EvaluationFile,
  FileID,
  ProfileFile,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {FilteredDataModule} from './data_filters';

/** We make some new variant types of the Contextual types, to include their files*/
export function isFromProfileFile(p: SourcedContextualizedProfile) {
  return p.sourced_from === null;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'data'
})
export class InspecData extends VuexModule {
  /** State var containing all execution files that have been added */
  executionFiles: EvaluationFile[] = [];

  /** State var containing all profile files that have been added */
  profileFiles: ProfileFile[] = [];

  /** Return all of the files that we currently have. */
  get allFiles(): (EvaluationFile | ProfileFile)[] {
    const result: (EvaluationFile | ProfileFile)[] = [];
    result.push(...this.executionFiles);
    result.push(...this.profileFiles);
    return result;
  }

  /* Return all evaluation files only */
  get allEvaluationFiles(): EvaluationFile[] {
    return this.executionFiles;
  }

  /* Return all profile files only */
  get allProfileFiles(): ProfileFile[] {
    return this.profileFiles;
  }

  /**
   * Returns a readonly list of all executions currently held in the data store
   * including associated context
   */
  get contextualExecutions(): readonly SourcedContextualizedEvaluation[] {
    return this.executionFiles.map((file) => file.evaluation);
  }

  get loadedDatabaseIds(): string[] {
    const ids: string[] = [];
    this.allFiles.forEach((file) => {
      if (file.database_id) {
        ids.push(file.database_id.toString());
      }
    });
    return ids;
  }

  /**
   * Returns a readonly list of all profiles belonging to executions currently
   * held in the data store
   */
  get contextualExecutionProfiles(): readonly SourcedContextualizedProfile[] {
    return this.contextualExecutions.flatMap(
      (evaluation) => evaluation.contains
    ) as SourcedContextualizedProfile[];
  }

  /**
   * Returns a readonly list of all profiles currently held in the data store
   * including associated context
   */
  get contextualProfiles(): readonly SourcedContextualizedProfile[] {
    return this.profileFiles.map((file) => file.profile);
  }

  get allProfiles(): readonly SourcedContextualizedProfile[] {
    return this.contextualProfiles.concat(this.contextualExecutionProfiles);
  }

  /**
   * Adds a profile file to the store.
   * @param newProfile The profile to add
   */
  @Mutation
  addProfile(newProfile: ProfileFile) {
    this.profileFiles.push(newProfile);
  }

  /**
   * Adds an execution file to the store.
   * @param newExecution The execution to add
   */
  @Mutation
  addExecution(newExecution: EvaluationFile) {
    this.executionFiles.push(newExecution);
  }

  /**
   * Unloads the file with the given id
   */
  @Action
  removeFile(fileId: FileID) {
    FilteredDataModule.clear_file(fileId);
    this.context.commit('REMOVE_PROFILE', fileId);
    this.context.commit('REMOVE_RESULT', fileId);
  }

  @Mutation
  REMOVE_PROFILE(fileId: FileID) {
    this.profileFiles = this.profileFiles.filter(
      (pf) => pf.unique_id !== fileId
    );
  }

  @Mutation
  REMOVE_RESULT(fileId: FileID) {
    this.executionFiles = this.executionFiles.filter(
      (ef) => ef.unique_id !== fileId
    );
  }

  /**
   * Clear all stored data.
   */
  @Mutation
  reset() {
    this.profileFiles = [];
    this.executionFiles = [];
  }
}

export const InspecDataModule = getModule(InspecData);
