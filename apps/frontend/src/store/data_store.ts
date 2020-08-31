/**
 * Tracks uploaded files, and their parsed contents
 */

import {
  Module,
  VuexModule,
  Mutation,
  Action,
  getModule
} from 'vuex-module-decorators';
import {context} from 'inspecjs';
import {
  FileID,
  EvaluationFile,
  ProfileFile,
  SourcedContextualizedProfile,
  SourcedContextualizedEvaluation
} from '@/store/report_intake';
import Store from '@/store/store';
import {FilteredDataModule} from './data_filters';

/** We make some new variant types of the Contextual types, to include their files*/
export function isFromProfileFile(
  p: context.ContextualizedProfile
): p is SourcedContextualizedProfile {
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

  /** TODO: do we have a need to keep this function?  It can be replicated
   * by a caller by calling the allEvaluationFiles() and allProfileFiles()
   */
  /** Return all of the files that we currently have. */
  get allFiles(): (EvaluationFile | ProfileFile)[] {
    let result: (EvaluationFile | ProfileFile)[] = [];
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
   * Recompute all contextual data
   */
  get contextStore(): [
    readonly SourcedContextualizedEvaluation[],
    readonly context.ContextualizedProfile[],
    readonly context.ContextualizedControl[]
  ] {
    // Initialize all our arrays
    let evaluations: SourcedContextualizedEvaluation[] = [];
    let profiles: context.ContextualizedProfile[] = [];
    let controls: context.ContextualizedControl[] = [];

    // Process our data
    for (let f of this.executionFiles) {
      evaluations.push(f.evaluation);
      profiles.push(...f.evaluation.contains);
    }

    for (let f of this.profileFiles) {
      profiles.push(f.profile);
    }

    for (let p of profiles) {
      controls.push(...p.contains);
    }

    return [evaluations, profiles, controls];
  }

  /**
   * Returns a readonly list of all executions currently held in the data store
   * including associated context
   */
  get contextualExecutions(): readonly SourcedContextualizedEvaluation[] {
    return this.contextStore[0];
  }

  /**
   * Returns a readonly list of all profiles currently held in the data store
   * including associated context
   */
  get contextualProfiles(): readonly context.ContextualizedProfile[] {
    return this.contextStore[1];
  }

  /**
   * Returns a readonly list of all controls currently held in the data store
   * including associated context
   */
  get contextualControls(): readonly context.ContextualizedControl[] {
    return this.contextStore[2];
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
  @Mutation
  removeFile(file_id: FileID) {
    this.profileFiles = this.profileFiles.filter(
      pf => pf.unique_id !== file_id
    );
    this.executionFiles = this.executionFiles.filter(
      ef => ef.unique_id !== file_id
    );
    FilteredDataModule.set_toggle_file_off(file_id);
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
