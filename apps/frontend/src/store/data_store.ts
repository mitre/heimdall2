/**
 * Tracks uploaded files, and their parsed contents
 */

import type {
  EvaluationFile,
  FileID,
  ProfileFile,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import Store from '@/store/store';
import {setControlDescription} from '@mitre/hdf-converters';
import type {ContextualizedControl} from 'inspecjs';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {FilteredDataModule} from './data_filters';

export const UNSAVED_CHANGES_MESSAGE =
  'This file has unsaved edits. Export or save the file before ' +
  'removing it from the loaded results.';

export function isFromProfileFile(p: SourcedContextualizedProfile): boolean {
  return p.sourcedFrom === null;
}

function getFileForControl(
  control: ContextualizedControl
): EvaluationFile | ProfileFile | undefined {
  const profile = control.sourcedFrom as SourcedContextualizedProfile;
  const evaluation = profile.sourcedFrom as
    | SourcedContextualizedEvaluation
    | null;
  return evaluation?.from_file ?? profile.from_file;
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

  /** Tracks which files have unsaved edits (dirty state) */
  dirtyFileIds: FileID[] = [];

  get allFiles(): (EvaluationFile | ProfileFile)[] {
    return [...this.executionFiles, ...this.profileFiles];
  }

  get allEvaluationFiles(): EvaluationFile[] {
    return this.executionFiles;
  }

  get allProfileFiles(): ProfileFile[] {
    return this.profileFiles;
  }

  get hasUnsavedFiles(): boolean {
    return this.dirtyFileIds.length > 0;
  }

  get isFileDirty(): (fileId: FileID) => boolean {
    return (fileId: FileID) => this.dirtyFileIds.includes(fileId);
  }

  /**
   * Returns a readonly list of all executions currently held in the data store
   * including associated context
   */
  get contextualExecutions(): readonly SourcedContextualizedEvaluation[] {
    return this.executionFiles.map((file) => file.evaluation);
  }

  get loadedDatabaseIds(): string[] {
    return this.allFiles
      .filter((file) => file.database_id !== undefined)
      .map((file) => file.database_id!.toString());
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

  @Mutation
  updateControlDescription({
    control,
    label,
    value
  }: {
    control: ContextualizedControl;
    label: string;
    value: string;
  }) {
    const controlData = control.data as {
      descriptions?: {label: string; data: string}[] | Record<string, string>;
    };
    if (controlData.descriptions) {
      setControlDescription(controlData.descriptions, label, value);
    }
    control.hdf.descriptions[label] = value;

    const file = getFileForControl(control);
    if (file) {
      this.MARK_FILE_DIRTY(file.uniqueId);
    }
  }

  @Mutation
  MARK_FILE_DIRTY(fileId: FileID) {
    if (!this.dirtyFileIds.includes(fileId)) {
      this.dirtyFileIds = [...this.dirtyFileIds, fileId];
    }
  }

  @Mutation
  MARK_FILES_SAVED(fileIds: FileID[]) {
    this.dirtyFileIds = this.dirtyFileIds.filter(
      (id) => !fileIds.includes(id)
    );
  }

  @Mutation
  CLEAR_DIRTY_FILES() {
    this.dirtyFileIds = [];
  }

  @Action
  markFileDirty(fileId: FileID) {
    this.context.commit('MARK_FILE_DIRTY', fileId);
  }

  @Action
  markFileSaved(fileIds: FileID[]) {
    this.context.commit('MARK_FILES_SAVED', fileIds);
  }

  @Action
  clearDirtyFiles() {
    this.context.commit('CLEAR_DIRTY_FILES');
  }

  /**
   * Unloads the file with the given id
   */
  @Action
  removeFile(fileId: FileID) {
    FilteredDataModule.clear_file(fileId);
    this.context.commit('MARK_FILES_SAVED', [fileId]);
    this.context.commit('REMOVE_PROFILE', fileId);
    this.context.commit('REMOVE_RESULT', fileId);
  }

  get databaseIdForFile(): (fileId: FileID) => string {
    return (fileId: FileID) => {
      const file = this.allFiles.find((f) => f.uniqueId === fileId);
      return file?.database_id?.toString() ?? '';
    };
  }

  get fileIdForDatabaseId(): (databaseId: number) => FileID {
    return (databaseId: number) => {
      const file = this.allFiles.find((f) => f.database_id === databaseId);
      return file?.uniqueId ?? '';
    };
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

  /**
   * Clear all stored data.
   */
  @Mutation
  reset() {
    this.profileFiles = [];
    this.executionFiles = [];
    this.dirtyFileIds = [];
  }
}

export const InspecDataModule = getModule(InspecData);
