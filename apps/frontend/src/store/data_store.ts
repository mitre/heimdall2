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
import {isSbomFile} from '@/utilities/sbom_util';

/** We make some new variant types of the Contextual types, to include their files*/
export function isFromProfileFile(p: SourcedContextualizedProfile) {
  return p.sourcedFrom === null;
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

  /**
   * State var containing all SBOM files that have been added
   * Note: some SBOMs are only contained in `executionFiles` because
   * they contain results as well
   */
  sbomFiles: EvaluationFile[] = [];

  /** Return all of the files that we currently have. */
  get allFiles(): (EvaluationFile | ProfileFile)[] {
    const result: (EvaluationFile | ProfileFile)[] = [];
    result.push(...this.executionFiles);
    result.push(...this.profileFiles);
    result.push(...this.sbomFiles);
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

  /* Return all sbom files only */
  get allSbomFiles(): EvaluationFile[] {
    return this.executionFiles
      .filter((f) => isSbomFile(f))
      .concat(this.sbomFiles);
  }

  /**
   * Returns a readonly list of all executions currently held in the data store
   * including associated context
   */
  get contextualExecutions(): readonly SourcedContextualizedEvaluation[] {
    return this.executionFiles.map((file) => file.evaluation);
  }

  /**
   * Returns a readonly list of all SBOMs currently held in the data store
   * including associated context
   */
  get contextualSboms(): readonly SourcedContextualizedEvaluation[] {
    return this.allSbomFiles.map((file) => file.evaluation);
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
   * Adds an SBOM file to the store.
   * @param newSbom The new SBOM to add
   */
  @Mutation
  addSbom(newSbom: EvaluationFile) {
    this.sbomFiles.push(newSbom);
  }

  /**
   * Unloads the file with the given id
   */
  @Action
  removeFile(fileId: FileID) {
    FilteredDataModule.clear_file(fileId);
    this.context.commit('REMOVE_PROFILE', fileId);
    this.context.commit('REMOVE_RESULT', fileId);
    this.context.commit('REMOVE_SBOM', fileId);
  }

  @Action
  async loadedDatabaseIdsForFileId(fileId: FileID): Promise<string> {
    let dbId: string | undefined = '';
    this.allFiles.forEach((file) => {
      if (file.uniqueId == fileId) {
        dbId = file.database_id?.toString();
      }
    });
    return dbId;
  }

  @Action
  async loadedFileIsForDatabaseIds(databaseId: number): Promise<FileID> {
    let fileId: string | undefined = '';
    this.allFiles.forEach((file) => {
      if (file.database_id == databaseId) {
        fileId = file.uniqueId;
      }
    });
    return fileId;
  }

  @Mutation
  REMOVE_PROFILE(fileId: FileID) {
    this.profileFiles = this.profileFiles.filter(
      (pf) => pf.uniqueId !== fileId
    );
  }

  @Mutation
  REMOVE_RESULT(fileId: FileID) {
    this.executionFiles = this.executionFiles.filter(
      (ef) => ef.uniqueId !== fileId
    );
  }

  @Mutation
  REMOVE_SBOM(fileId: FileID) {
    this.sbomFiles = this.sbomFiles.filter((sf) => sf.uniqueId !== fileId);
  }

  /**
   * Clear all stored data.
   */
  @Mutation
  reset() {
    this.profileFiles = [];
    this.executionFiles = [];
    this.sbomFiles = [];
  }
}

export const InspecDataModule = getModule(InspecData);
