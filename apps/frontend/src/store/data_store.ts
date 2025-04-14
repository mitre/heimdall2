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
import {Asset, ChecklistAsset, ChecklistObject} from '@mitre/hdf-converters';
import _ from 'lodash';
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
  return p.sourcedFrom === null;
}
/** Checklist file type  */
export type ChecklistFile = ChecklistObject & {
  filename: string;
};
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

  /** State var containing all checklist files that have been added */
  checklistFiles: EvaluationFile[] = [];

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

  /** Return all checklist files only */
  get allChecklistFiles(): EvaluationFile[] {
    const cklFiles: EvaluationFile[] = [];
    const files: EvaluationFile[] = this.executionFiles;
    for (const file of files) {
      const checklist: ChecklistObject = _.get(
        file.evaluation.data,
        'passthrough.checklist'
      ) as unknown as ChecklistObject;
      if (checklist) {
        cklFiles.push(file);
      }
    }
    return cklFiles;
  }

  /** Get specific checklist file by fileID */
  get getChecklist(): (fileID: FileID) => ChecklistFile {
    return (fileID: FileID) => {
      const checklistFile = this.allChecklistFiles.find(
        (f) => f.uniqueId === fileID
      );
      const checklist: ChecklistObject = _.get(
        checklistFile?.evaluation.data,
        'passthrough.checklist'
      ) as unknown as ChecklistObject;
      return {
        ...checklist,
        filename: checklistFile?.filename ?? 'Default Checklist Filename'
      };
    };
  }

  /**
   * Updates the execution file with the provided asset.
   *
   * @param {Object} params - The parameters for the update.
   * @param {FileID} params.fileId - The unique identifier of the file to update.
   * @param {Asset} params.asset - The asset to update in the execution file.
   */ @Mutation
  UPDATE_CHECKLIST_ASSET({file, asset}: {file: FileID; asset: ChecklistAsset}) {
    const index = this.executionFiles.findIndex((f) => f.uniqueId === file);
    if (index > -1) {
      // Update the execution file logic here
      _.set(
        this.executionFiles[index].evaluation,
        'data.passthrough.checklist.asset',
        asset
      );
    }
  }

  @Action
  updateChecklistAsset({file, asset}: {file: FileID; asset: ChecklistAsset}) {
    this.context.commit('UPDATE_CHECKLIST_ASSET', {file, asset});
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
    for (const file of this.allFiles) {
      if (file.database_id) {
        ids.push(file.database_id.toString());
      }
    }
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
   * Adds a checklist file to the store.
   * @param newChecklist The checklist to add
   */
  @Mutation
  addChecklist(newChecklist: EvaluationFile) {
    this.checklistFiles.push(newChecklist);
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
    this.context.commit('REMOVE_CHECKLIST', fileId);
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
  REMOVE_CHECKLIST(fileId: FileID) {
    const index = this.checklistFiles.findIndex((cf) => cf.uniqueId !== fileId);
    if (index > -1) {
      this.checklistFiles.splice(index, 1);
    }
  }

  /**
   * Clear all stored data.
   */
  @Mutation
  reset() {
    this.profileFiles = [];
    this.executionFiles = [];
    this.checklistFiles = [];
  }
}

export const InspecDataModule = getModule(InspecData);
