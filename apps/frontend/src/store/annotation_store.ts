import { addAttestationToHDF } from '@mitre/hdf-converters';
import { saveAs } from 'file-saver';
import type { ContextualizedControl, ExecJSON } from 'inspecjs';
import type { AttestationData } from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import * as _ from 'lodash';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule,
} from 'vuex-module-decorators';
import type {
  EvaluationFile,
  FileID,
} from '@/store/report_intake';
import Store from '@/store/store';
import {
  toAttestationJson,
  toAttestationXlsx,
  toAttestationYaml,
  toHeimdallBundle,
} from '@/utilities/export_attestations';

export type CommentEntry = {
  control_id: string;
  text: string;
  updated: string;
  updated_by: string;
};

export type FileAnnotationState = {
  attestations: AttestationData[];
  commentLog: CommentEntry[];
  fileId: FileID;
  originalStatuses: Record<string, string>;
};

function indexKey(fileId: FileID, controlId: string): string {
  return `${fileId}:${controlId}`;
}

@Module({
  dynamic: true,
  name: 'annotations',
  namespaced: true,
  store: Store,
})
export class AnnotationStore extends VuexModule {
  attestationIndex: Record<string, AttestationData> = {};

  commentIndex: Record<string, boolean> = {};
  fileAnnotations: FileAnnotationState[] = [];

  get annotationsForFile(): (fileId: FileID) => FileAnnotationState | undefined {
    return (fileId: FileID) =>
      this.fileAnnotations.find(fa => fa.fileId === fileId);
  }

  get attestationCount(): number {
    return this.fileAnnotations.reduce(
      (sum, fa) => sum + fa.attestations.length,
      0,
    );
  }

  get attestationsForFile(): (fileId: FileID) => AttestationData[] {
    return (fileId: FileID) => {
      const state = this.fileAnnotations.find(fa => fa.fileId === fileId);
      return state ? state.attestations : [];
    };
  }

  get commentCount(): number {
    return this.fileAnnotations.reduce(
      (sum, fa) => sum + fa.commentLog.length,
      0,
    );
  }

  get commentsForControl(): (
    fileId: FileID,
    controlId: string,
  ) => CommentEntry[] {
    return (fileId: FileID, controlId: string) => {
      const state = this.fileAnnotations.find(fa => fa.fileId === fileId);
      if (!state) { return []; }
      return state.commentLog.filter(c => c.control_id === controlId);
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

  get pendingFiles(): FileID[] {
    return this.fileAnnotations
      .filter(fa => fa.attestations.length > 0 || fa.commentLog.length > 0)
      .map(fa => fa.fileId);
  }

  @Mutation
  ADD_ATTESTATION(payload: {
    attestation: AttestationData;
    fileId: FileID;
    originalStatuses?: Record<string, string>;
  }) {
    const { attestation, fileId, originalStatuses } = payload;
    const state = this.fileAnnotations.find(fa => fa.fileId === fileId);

    if (state) {
      const existingIdx = state.attestations.findIndex(
        a => a.control_id === attestation.control_id,
      );
      state.attestations = existingIdx === -1
        ? [...state.attestations, attestation]
        : [
          ...state.attestations.slice(0, existingIdx),
          attestation,
          ...state.attestations.slice(existingIdx + 1),
        ];
      if (
        originalStatuses
        && Object.keys(state.originalStatuses).length === 0
      ) {
        state.originalStatuses = originalStatuses;
      }
    } else {
      const newState: FileAnnotationState = {
        attestations: [attestation],
        commentLog: [],
        fileId,
        originalStatuses: originalStatuses ?? {},
      };
      this.fileAnnotations = [...this.fileAnnotations, newState];
    }

    this.attestationIndex = {
      ...this.attestationIndex,
      [indexKey(fileId, attestation.control_id)]: attestation,
    };
  }

  @Mutation
  ADD_COMMENT(payload: { comment: CommentEntry; fileId: FileID }) {
    const { comment, fileId } = payload;
    const state = this.fileAnnotations.find(fa => fa.fileId === fileId);

    if (state) {
      state.commentLog = [...state.commentLog, comment];
    } else {
      const newState: FileAnnotationState = {
        attestations: [],
        commentLog: [comment],
        fileId,
        originalStatuses: {},
      };
      this.fileAnnotations = [...this.fileAnnotations, newState];
    }

    this.commentIndex = {
      ...this.commentIndex,
      [indexKey(fileId, comment.control_id)]: true,
    };
  }

  @Action
  addAttestation(payload: {
    controlId: string;
    explanation: string;
    fileId: FileID;
    frequency: string;
    originalStatuses?: Record<string, string>;
    status: 'failed' | 'passed';
    updatedBy: string;
  }) {
    const { controlId, explanation, fileId, frequency, originalStatuses, status, updatedBy } = payload;
    const attestation: AttestationData = {
      control_id: controlId,
      explanation,
      frequency,
      status: status as AttestationData['status'],
      updated: new Date().toISOString(),
      updated_by: updatedBy,
    };
    this.context.commit('ADD_ATTESTATION', { attestation, fileId, originalStatuses });
  }

  @Action
  addComment(payload: { comment: CommentEntry; fileId: FileID }) {
    this.context.commit('ADD_COMMENT', payload);
  }

  @Action
  addCommentWithControl(payload: {
    control: ContextualizedControl;
    fileId: FileID;
    text: string;
    updatedBy: string;
  }) {
    const { control, fileId, text, updatedBy } = payload;
    const comment: CommentEntry = {
      control_id: control.data.id,
      text,
      updated: new Date().toISOString(),
      updated_by: updatedBy,
    };
    this.context.commit('ADD_COMMENT', { comment, fileId });

    this.context.commit(
      'data/updateControlDescription',
      { control, label: 'comments', value: text },
      { root: true },
    );
  }

  @Action
  applyAttestationsToHdf(payload: { fileId: FileID }): ExecJSON.Execution | undefined {
    const { fileId } = payload;
    const state = this.fileAnnotations.find(fa => fa.fileId === fileId);
    if (!state || state.attestations.length === 0) { return undefined; }

    const dataState = this.context.rootState.data;
    const allFiles = [
      ...(dataState.executionFiles || []),
      ...(dataState.profileFiles || []),
    ];
    const file = allFiles.find(
      (f: { uniqueId: string }) => f.uniqueId === fileId,
    ) as EvaluationFile | undefined;
    if (!file || !('evaluation' in file)) { return undefined; }

    const clone: ExecJSON.Execution = _.cloneDeep(file.evaluation.data);
    const attestations = state.attestations.map(a => ({
      ...a,
      status: `${a.status}` as `${typeof a.status}`,
    }));
    return addAttestationToHDF(clone, attestations);
  }

  @Mutation
  CLEAR_FILE_ANNOTATIONS(fileId: FileID) {
    const state = this.fileAnnotations.find(fa => fa.fileId === fileId);
    if (!state) { return; }

    const newAttestIndex = { ...this.attestationIndex };
    for (const a of state.attestations) {
      delete newAttestIndex[indexKey(fileId, a.control_id)];
    }
    this.attestationIndex = newAttestIndex;

    const newCommentIndex = { ...this.commentIndex };
    for (const c of state.commentLog) {
      delete newCommentIndex[indexKey(fileId, c.control_id)];
    }
    this.commentIndex = newCommentIndex;

    this.fileAnnotations = this.fileAnnotations.filter(
      fa => fa.fileId !== fileId,
    );
  }

  @Action
  clearFileAnnotations(fileId: FileID) {
    this.context.commit('CLEAR_FILE_ANNOTATIONS', fileId);
  }

  @Action
  exportAttestations(payload: {
    fileId: FileID;
    filename?: string;
    format: 'bundle' | 'json' | 'xlsx' | 'yaml';
  }) {
    const { fileId, filename, format } = payload;
    const state = this.fileAnnotations.find(fa => fa.fileId === fileId);
    if (!state) { return; }

    const baseName = filename ?? `attestations-${fileId.slice(0, 8)}`;

    switch (format) {
      case 'bundle': {
        const data = toHeimdallBundle(state.attestations, state.commentLog);
        saveAs(new Blob([data], { type: 'application/json' }), `${baseName}.heimdall.json`);
        break;
      }
      case 'json': {
        const data = toAttestationJson(state.attestations);
        saveAs(new Blob([data], { type: 'application/json' }), `${baseName}.json`);
        break;
      }
      case 'xlsx': {
        const u8 = toAttestationXlsx(state.attestations, state.commentLog);
        const blob = new Blob([u8], { type: 'application/vnd.ms-excel' });
        saveAs(blob, `${baseName}.xlsx`);
        break;
      }
      case 'yaml': {
        const yamlData = toAttestationYaml(state.attestations);
        saveAs(new Blob([yamlData], { type: 'text/yaml' }), `${baseName}.yaml`);
        break;
      }
    }
  }

  @Mutation
  IMPORT_ANNOTATIONS(payload: { fileId: FileID; state: FileAnnotationState }) {
    const { fileId, state: importState } = payload;

    this.fileAnnotations = [
      ...this.fileAnnotations.filter(fa => fa.fileId !== fileId),
      importState,
    ];

    const newAttestIndex = { ...this.attestationIndex };
    for (const a of importState.attestations) {
      newAttestIndex[indexKey(fileId, a.control_id)] = a;
    }
    this.attestationIndex = newAttestIndex;

    const newCommentIndex = { ...this.commentIndex };
    for (const c of importState.commentLog) {
      newCommentIndex[indexKey(fileId, c.control_id)] = true;
    }
    this.commentIndex = newCommentIndex;
  }

  @Action
  importAnnotations(payload: { fileId: FileID; state: FileAnnotationState }) {
    this.context.commit('IMPORT_ANNOTATIONS', payload);
  }

  @Mutation
  REMOVE_ATTESTATION(payload: { controlId: string; fileId: FileID }) {
    const { controlId, fileId } = payload;
    const state = this.fileAnnotations.find(fa => fa.fileId === fileId);
    if (!state) { return; }

    state.attestations = state.attestations.filter(
      a => a.control_id !== controlId,
    );

    const { [indexKey(fileId, controlId)]: _, ...remaining }
      = this.attestationIndex;
    this.attestationIndex = remaining;
  }

  @Action
  removeAttestation(payload: { controlId: string; fileId: FileID }) {
    this.context.commit('REMOVE_ATTESTATION', payload);
  }
}

export const AnnotationModule = getModule(AnnotationStore);
