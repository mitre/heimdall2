/**
 * Tracks uploaded files, and their parsed contents
 */

import { Module, VuexModule, Mutation, Action } from "vuex-module-decorators";
import {
  HDFControl,
  parse,
  schemas_1_0,
  hdfWrapControl,
  ControlStatus,
  context
} from "inspecjs";
import { FileID, EvaluationFile, ProfileFile } from "@/store/report_intake";
import Store from "@/store/store";

/** We make some new variant types of the Contextual types, to include their files*/
export interface SourcedContextualizedProfile
  extends context.ContextualizedProfile {
  from_file: ProfileFile;
}

export function isFromProfileFile(
  p: context.ContextualizedProfile
): p is SourcedContextualizedProfile {
  return p.sourced_from === null;
}

export interface SourcedContextualizedEvaluation
  extends context.ContextualizedEvaluation {
  from_file: EvaluationFile;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "data"
})
class InspecDataModule extends VuexModule {
  /** State var containing all execution files that have been added */
  executionFiles: EvaluationFile[] = [];

  /** State var containing all profile files that have been added */
  profileFiles: ProfileFile[] = [];

  /** Return all of the files that we currently have. */
  get allFiles(): (EvaluationFile | ProfileFile)[] {
    let result: (EvaluationFile | ProfileFile)[] = [];
    result.push(...this.executionFiles);
    result.push(...this.profileFiles);
    return result;
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
    let executions: SourcedContextualizedEvaluation[] = [];
    let profiles: context.ContextualizedProfile[] = [];
    let controls: context.ContextualizedControl[] = [];

    // Process our data
    for (let f of this.executionFiles) {
      let fc = context.contextualizeEvaluation(f.execution);
      let sfc = (fc as unknown) as SourcedContextualizedEvaluation;
      sfc.from_file = f;
      executions.push(Object.freeze(sfc));
      profiles.push(...fc.contains);
    }

    for (let f of this.profileFiles) {
      let fc = context.contextualizeProfile(f.profile);
      let sfc = (fc as unknown) as SourcedContextualizedProfile;
      sfc.from_file = f;
      profiles.push(Object.freeze(sfc));
    }

    for (let p of profiles) {
      controls.push(...p.contains);
    }

    return [executions, profiles, controls];
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

export default InspecDataModule;
