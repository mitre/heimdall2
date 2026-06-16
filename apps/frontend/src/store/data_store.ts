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
import {ContextualizedControl, ExecJSON} from 'inspecjs';
import Vue from 'vue';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {FilteredDataModule} from './data_filters';

export const UNSAVED_CHANGES_MESSAGE =
  'This file has unsaved comments edits. Export or save the file before ' +
  'removing it from the loaded results.';

type UpdateControlCommentsPayload = {
  control: ContextualizedControl;
  comments: string;
};

type EditableControlData = {
  descriptions?:
    | ExecJSON.ControlDescription[]
    | Record<string, string>
    | null;
  id: string;
  tags?: Record<string, unknown>;
};

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

/** We make some new variant types of the Contextual types, to include their files*/
export function isFromProfileFile(p: SourcedContextualizedProfile) {
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

function updateDescriptionArray(
  control: ContextualizedControl,
  comments: string
) {
  const controlData = control.data as EditableControlData;
  if (control.hdf.isProfile) {
    const descriptions: Record<string, string> =
      controlData.descriptions && !Array.isArray(controlData.descriptions)
        ? controlData.descriptions
        : {};
    descriptions.comments = comments;
    controlData.descriptions = descriptions;
    return;
  }

  const descriptions = Array.isArray(controlData.descriptions)
    ? controlData.descriptions
    : [];
  controlData.descriptions = descriptions;

  const commentDescription = descriptions.find(
    (description: ExecJSON.ControlDescription) =>
      description.label === 'comments'
  );

  if (commentDescription) {
    commentDescription.data = comments;
  } else {
    descriptions.push({data: comments, label: 'comments'});
  }
}

function updateStructuredChecklistComments(
  currentComments: unknown,
  comments: string
): string {
  const existingComments =
    typeof currentComments === 'string' ? currentComments : '';

  if (!existingComments.includes(' :: ')) {
    return comments;
  }

  let commentsSectionUpdated = false;
  const sections = existingComments
    .split(/\n(?=[A-Z]+ ::)/gv)
    .map((section) => section.trimEnd())
    .filter((section) => section.length > 0)
    .flatMap((section) => {
      if (!section.startsWith('COMMENTS :: ')) {
        return [section];
      }

      commentsSectionUpdated = true;
      return comments ? [`COMMENTS :: ${comments}`] : [];
    });

  if (!commentsSectionUpdated && comments) {
    sections.push(`COMMENTS :: ${comments}`);
  }

  return sections.join('\n');
}

function updateChecklistPassthroughComments(
  file: EvaluationFile | ProfileFile,
  control: ContextualizedControl,
  comments: string
) {
  if (!('evaluation' in file)) {
    return;
  }

  const evaluationData = file.evaluation
    .data as unknown as Record<string, unknown>;
  const passthrough = evaluationData.passthrough as
    | {checklist?: {stigs?: {vulns?: Record<string, unknown>[]}[]}}
    | undefined;
  const checklist = passthrough?.checklist;
  if (!checklist?.stigs) {
    return;
  }

  const controlData = control.data as EditableControlData;
  const controlTags = controlData.tags ?? {};
  const targetIdentifiers = [
    [controlData.id, 'vulnNum'],
    [controlTags.rid, 'ruleId'],
    [controlTags.stig_id, 'ruleVer'],
    [controlTags.STIGRef, 'stigRef']
  ] as const;
  for (const stig of checklist.stigs) {
    for (const vuln of stig.vulns ?? []) {
      const matches = targetIdentifiers
        .map(([targetValue, vulnKey]) => {
          const target = nonEmptyString(targetValue);
          const source = nonEmptyString(vuln[vulnKey]);
          return target && source ? source === target : undefined;
        })
        .filter((match): match is boolean => match !== undefined);
      if (matches.length >= 2 && matches.every(Boolean)) {
        vuln.comments = updateStructuredChecklistComments(
          vuln.comments,
          comments
        );
        return;
      }
    }
  }
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

  get hasUnsavedFiles(): boolean {
    return this.allFiles.some((file) => file.hasUnsavedChanges);
  }

  get fileHasUnsavedChanges(): (fileId: FileID) => boolean {
    return (fileId: FileID) =>
      Boolean(
        this.allFiles.find((file) => file.uniqueId === fileId)
          ?.hasUnsavedChanges
      );
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

  @Mutation
  updateControlComments({control, comments}: UpdateControlCommentsPayload) {
    updateDescriptionArray(control, comments);
    control.hdf.descriptions.comments = comments;

    const file = getFileForControl(control);
    if (file) {
      updateChecklistPassthroughComments(file, control, comments);
      Vue.set(file, 'hasUnsavedChanges', true);
    }
  }

  @Mutation
  MARK_FILE_SAVED(fileId: FileID) {
    const file = this.allFiles.find(
      (storedFile) => storedFile.uniqueId === fileId
    );
    if (file) {
      Vue.set(file, 'hasUnsavedChanges', false);
    }
  }

  @Action
  markFileSaved(fileId: FileID) {
    this.context.commit('MARK_FILE_SAVED', fileId);
  }

  @Action
  markFilesSaved(fileIds: FileID[]) {
    fileIds.forEach((fileId) => this.context.commit('MARK_FILE_SAVED', fileId));
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
