import type {
  EvaluationFile,
  FileID
} from '@/store/report_intake';
import Store from '@/store/store';
import {
  toAttestationXlsx,
  toHeimdallBundle,
  toAttestationJson,
  toAttestationYaml
} from '@/utilities/export_attestations';
import {addAttestationToHDF} from '@mitre/hdf-converters';
import type {AttestationData} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import type {ContextualizedControl, ExecJSON} from 'inspecjs';
import {saveAs} from 'file-saver';
import * as _ from 'lodash';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

export interface CommentEntry {
  control_id: string;
  text: string;
  updated: string;
  updated_by: string;
}

export interface FileAnnotationState {
  fileId: FileID;
  attestations: AttestationData[];
  commentLog: CommentEntry[];
  originalStatuses: Record<string, string>;
}

function indexKey(fileId: FileID, controlId: string): string {
  return `${fileId}:${controlId}`;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'annotations'
})
export class AnnotationStore extends VuexModule {
  fileAnnotations: FileAnnotationState[] = [];

  attestationIndex: Record<string, AttestationData> = {};
  commentIndex: Record<string, boolean> = {};

  get annotationsForFile(): (fileId: FileID) => FileAnnotationState | undefined {
    return (fileId: FileID) =>
      this.fileAnnotations.find((fa) => fa.fileId === fileId);
  }

  get attestationsForFile(): (fileId: FileID) => AttestationData[] {
    return (fileId: FileID) => {
      const state = this.fileAnnotations.find((fa) => fa.fileId === fileId);
      return state ? state.attestations : [];
    };
  }

  get commentsForControl(): (
    fileId: FileID,
    controlId: string
  ) => CommentEntry[] {
    return (fileId: FileID, controlId: string) => {
      const state = this.fileAnnotations.find((fa) => fa.fileId === fileId);
      if (!state) return [];
      return state.commentLog.filter((c) => c.control_id === controlId);
    };
  }

  get hasAttestation(): (fileId: FileID, controlId: string) => boolean {
    return (fileId: FileID, controlId: string) =>
      this.attestationIndex[indexKey(fileId, controlId)] !== undefined;
  }

  get hasComments(): (fileId: FileID, controlId: string) => boolean {
    return (fileId: FileID, controlId: string) =>
      this.commentIndex[indexKey(fileId, controlId)] === true;
  }

  get attestationCount(): number {
    return this.fileAnnotations.reduce(
      (sum, fa) => sum + fa.attestations.length,
      0
    );
  }

  get commentCount(): number {
    return this.fileAnnotations.reduce(
      (sum, fa) => sum + fa.commentLog.length,
      0
    );
  }

  get pendingFiles(): FileID[] {
    return this.fileAnnotations
      .filter((fa) => fa.attestations.length > 0 || fa.commentLog.length > 0)
      .map((fa) => fa.fileId);
  }

  @Mutation
  ADD_ATTESTATION(payload: {
    fileId: FileID;
    attestation: AttestationData;
    originalStatuses?: Record<string, string>;
  }) {
    const {fileId, attestation, originalStatuses} = payload;
    let state = this.fileAnnotations.find((fa) => fa.fileId === fileId);

    if (!state) {
      const newState: FileAnnotationState = {
        fileId,
        attestations: [attestation],
        commentLog: [],
        originalStatuses: originalStatuses ?? {}
      };
      this.fileAnnotations = [...this.fileAnnotations, newState];
    } else {
      const existingIdx = state.attestations.findIndex(
        (a) => a.control_id === attestation.control_id
      );
      if (existingIdx >= 0) {
        state.attestations = [
          ...state.attestations.slice(0, existingIdx),
          attestation,
          ...state.attestations.slice(existingIdx + 1)
        ];
      } else {
        state.attestations = [...state.attestations, attestation];
      }
      if (
        originalStatuses &&
        Object.keys(state.originalStatuses).length === 0
      ) {
        state.originalStatuses = originalStatuses;
      }
    }

    this.attestationIndex = {
      ...this.attestationIndex,
      [indexKey(fileId, attestation.control_id)]: attestation
    };
  }

  @Mutation
  ADD_COMMENT(payload: {fileId: FileID; comment: CommentEntry}) {
    const {fileId, comment} = payload;
    let state = this.fileAnnotations.find((fa) => fa.fileId === fileId);

    if (!state) {
      const newState: FileAnnotationState = {
        fileId,
        attestations: [],
        commentLog: [comment],
        originalStatuses: {}
      };
      this.fileAnnotations = [...this.fileAnnotations, newState];
    } else {
      state.commentLog = [...state.commentLog, comment];
    }

    this.commentIndex = {
      ...this.commentIndex,
      [indexKey(fileId, comment.control_id)]: true
    };
  }

  @Mutation
  REMOVE_ATTESTATION(payload: {fileId: FileID; controlId: string}) {
    const {fileId, controlId} = payload;
    const state = this.fileAnnotations.find((fa) => fa.fileId === fileId);
    if (!state) return;

    state.attestations = state.attestations.filter(
      (a) => a.control_id !== controlId
    );

    const {[indexKey(fileId, controlId)]: _, ...remaining} =
      this.attestationIndex;
    this.attestationIndex = remaining;
  }

  @Mutation
  CLEAR_FILE_ANNOTATIONS(fileId: FileID) {
    const state = this.fileAnnotations.find((fa) => fa.fileId === fileId);
    if (!state) return;

    const newAttestIndex = {...this.attestationIndex};
    for (const a of state.attestations) {
      delete newAttestIndex[indexKey(fileId, a.control_id)];
    }
    this.attestationIndex = newAttestIndex;

    const newCommentIndex = {...this.commentIndex};
    for (const c of state.commentLog) {
      delete newCommentIndex[indexKey(fileId, c.control_id)];
    }
    this.commentIndex = newCommentIndex;

    this.fileAnnotations = this.fileAnnotations.filter(
      (fa) => fa.fileId !== fileId
    );
  }

  @Mutation
  IMPORT_ANNOTATIONS(payload: {fileId: FileID; state: FileAnnotationState}) {
    const {fileId, state: importState} = payload;

    this.fileAnnotations = [
      ...this.fileAnnotations.filter((fa) => fa.fileId !== fileId),
      importState
    ];

    const newAttestIndex = {...this.attestationIndex};
    for (const a of importState.attestations) {
      newAttestIndex[indexKey(fileId, a.control_id)] = a;
    }
    this.attestationIndex = newAttestIndex;

    const newCommentIndex = {...this.commentIndex};
    for (const c of importState.commentLog) {
      newCommentIndex[indexKey(fileId, c.control_id)] = true;
    }
    this.commentIndex = newCommentIndex;
  }

  @Action
  addAttestation(payload: {
    fileId: FileID;
    controlId: string;
    status: 'passed' | 'failed';
    explanation: string;
    frequency: string;
    updatedBy: string;
    originalStatuses?: Record<string, string>;
  }) {
    const {fileId, controlId, status, explanation, frequency, updatedBy, originalStatuses} = payload;
    const attestation: AttestationData = {
      control_id: controlId,
      status: status as AttestationData['status'],
      explanation,
      frequency,
      updated: new Date().toISOString(),
      updated_by: updatedBy
    };
    this.context.commit('ADD_ATTESTATION', {fileId, attestation, originalStatuses});
  }

  @Action
  addComment(payload: {fileId: FileID; comment: CommentEntry}) {
    this.context.commit('ADD_COMMENT', payload);
  }

  @Action
  addCommentWithControl(payload: {
    fileId: FileID;
    control: ContextualizedControl;
    text: string;
    updatedBy: string;
  }) {
    const {fileId, control, text, updatedBy} = payload;
    const comment: CommentEntry = {
      control_id: control.data.id,
      text,
      updated: new Date().toISOString(),
      updated_by: updatedBy
    };
    this.context.commit('ADD_COMMENT', {fileId, comment});

    this.context.commit(
      'data/updateControlDescription',
      {control, label: 'comments', value: text},
      {root: true}
    );
  }

  @Action
  removeAttestation(payload: {fileId: FileID; controlId: string}) {
    this.context.commit('REMOVE_ATTESTATION', payload);
  }

  @Action
  clearFileAnnotations(fileId: FileID) {
    this.context.commit('CLEAR_FILE_ANNOTATIONS', fileId);
  }

  @Action
  importAnnotations(payload: {fileId: FileID; state: FileAnnotationState}) {
    this.context.commit('IMPORT_ANNOTATIONS', payload);
  }

  @Action
  applyAttestationsToHdf(payload: {
    fileId: FileID;
  }): ExecJSON.Execution | undefined {
    const {fileId} = payload;
    const state = this.fileAnnotations.find((fa) => fa.fileId === fileId);
    if (!state || state.attestations.length === 0) return undefined;

    const dataState = this.context.rootState.data;
    const allFiles = [
      ...(dataState.executionFiles || []),
      ...(dataState.profileFiles || [])
    ];
    const file = allFiles.find(
      (f: {uniqueId: string}) => f.uniqueId === fileId
    ) as EvaluationFile | undefined;
    if (!file || !('evaluation' in file)) return undefined;

    const clone: ExecJSON.Execution = _.cloneDeep(file.evaluation.data);
    const attestations = state.attestations.map((a) => ({
      ...a,
      status: `${a.status}` as `${typeof a.status}`
    }));
    return addAttestationToHDF(clone, attestations);
  }

  @Action
  exportAttestations(payload: {
    fileId: FileID;
    format: 'json' | 'yaml' | 'xlsx' | 'bundle';
    filename?: string;
  }) {
    const {fileId, format, filename} = payload;
    const state = this.fileAnnotations.find((fa) => fa.fileId === fileId);
    if (!state) return;

    const baseName = filename ?? `attestations-${fileId.slice(0, 8)}`;

    switch (format) {
      case 'json': {
        const data = toAttestationJson(state.attestations);
        saveAs(new Blob([data], {type: 'application/json'}), `${baseName}.json`);
        break;
      }
      case 'bundle': {
        const data = toHeimdallBundle(state.attestations, state.commentLog);
        saveAs(new Blob([data], {type: 'application/json'}), `${baseName}.heimdall.json`);
        break;
      }
      case 'yaml': {
        const yamlData = toAttestationYaml(state.attestations);
        saveAs(new Blob([yamlData], {type: 'text/yaml'}), `${baseName}.yaml`);
        break;
      }
      case 'xlsx': {
        const u8 = toAttestationXlsx(state.attestations, state.commentLog);
        const blob = new Blob([u8], {type: 'application/vnd.ms-excel'});
        saveAs(blob, `${baseName}.xlsx`);
        break;
      }
    }
  }
}

export const AnnotationModule = getModule(AnnotationStore);
