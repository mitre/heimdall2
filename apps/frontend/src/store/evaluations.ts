import {SpinnerModule} from '@/store/spinner';
import Store from '@/store/store';
import {
  ICreateEvaluationTag,
  IEvalPaginationParams,
  IEvaluation,
  IEvaluationResponse,
  IEvaluationTag
} from '@heimdall/common/interfaces';
import axios from 'axios';
import * as _ from 'lodash';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {InspecDataModule} from './data_store';
import {
  EvaluationFile,
  FileID,
  FileLoadOptions,
  InspecIntakeModule,
  ProfileFile
} from './report_intake';
import {SnackbarModule} from './snackbar';

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'EvaluationModule'
})
export class Evaluation extends VuexModule {
  allEvaluations: IEvaluation[] = [];
  pagedEvaluations: IEvaluation[] = [];
  evaluationsCount: number = 0;
  page: number = 1;
  offset: number = 0;
  limit: number = 10;
  order: Array<string> = ['createdAt', 'DESC'];
  loading = true;

  get evaluationForFile(): Function {
    return (file: EvaluationFile | ProfileFile) => {
      try {
        return this.allEvaluations.find((e) => {
          return e.id === file.database_id?.toString();
        });
      } catch (err) {
        return false;
      }
    };
  }

  get evaluationsLoaded(): number {
    return this.allEvaluations.length;
  }

  get pagedEvaluationsCount(): number {
    return this.pagedEvaluations.length;
  }

  get allEvaluationTags(): string[] {
    return this.allEvaluations.flatMap((evaluation) => {
      return evaluation.evaluationTags.map((tag) => tag.value);
    });
  }

  @Action
  async getAllEvaluations(params: IEvalPaginationParams): Promise<void> {
    this.context.commit('SET_LOADING', true);
    return axios
      .get<IEvaluationResponse>('/evaluations', {params})
      .then(({data}) => {
        const {totalCount, evaluations} = data;
        this.context.commit('UPDATE_PARAMS', params);
        this.context.commit('SET_PAGED_EVALUATIONS', evaluations);
        this.context.commit('SET_ALL_EVALUATION_COUNT', totalCount);
      })
      .finally(() => {
        this.context.commit('SET_LOADING', false);
      });
  }

  @Action
  async load_results(evaluationIds: string[]): Promise<(FileID | void)[]> {
    document.body.style.cursor = 'wait';
    const unloadedIds = _.difference(
      evaluationIds,
      InspecDataModule.loadedDatabaseIds
    );
    let index = 1;
    const loadedIds: FileID[] = [];
    await Promise.all(
      unloadedIds.map(async (id) =>
        this.loadEvaluation(id)
          .then(async (evaluation) => {
            SpinnerModule.setMessage(`Loading: ${evaluation.filename}`);
            const value = Math.floor((index++ / evaluationIds.length) * 100);
            SpinnerModule.setValue(value);
            if (await InspecIntakeModule.isHDF(evaluation.data)) {
              InspecIntakeModule.loadText({
                text: JSON.stringify(evaluation.data),
                filename: evaluation.filename,
                database_id: evaluation.id,
                createdAt: evaluation.createdAt,
                updatedAt: evaluation.updatedAt,
                tags: [] // Tags are not yet implemented, so for now the value is passed in empty
              })
                .then((fileId) => loadedIds.push(fileId))
                .catch((err) => {
                  SnackbarModule.failure(err);
                });
            } else if (evaluation.data) {
              const inputFile: FileLoadOptions = {
                filename: evaluation.filename
              };
              if (
                'originalResultsData' in evaluation.data &&
                evaluation.data.originalResultsData
              ) {
                inputFile.data = evaluation.data.originalResultsData;
              } else {
                inputFile.data = JSON.stringify(evaluation.data);
              }

              const fileIds = await InspecIntakeModule.loadFile(inputFile);
              loadedIds.push(...fileIds);
            } else {
              SnackbarModule.failure(`Empty File: ${evaluation.filename}`);
            }
          })
          .catch((err) => {
            SnackbarModule.failure(err);
          })
      )
    );
    document.body.style.cursor = 'default';
    return loadedIds;
  }

  @Action
  evaluationLoaded(evalId: string) {
    return this.allEvaluations.find((obj) => {
      return obj.id === evalId;
    });
  }

  @Action
  async loadEvaluation(id: string) {
    return axios.get<IEvaluation>(`/evaluations/${id}`).then(({data}) => {
      this.context.commit('SAVE_EVALUATION', data);
      this.context.commit('SAVE_PAGED_EVALUATION', data);
      return data;
    });
  }

  @Action
  async updateEvaluation(evaluation: IEvaluation) {
    return axios
      .put<IEvaluation>(`/evaluations/${evaluation.id}`, evaluation)
      .then(({data}) => {
        this.context.commit('SAVE_EVALUATION', data);
        return data;
      });
  }

  @Action
  async deleteEvaluation(evaluation: IEvaluation) {
    this.context.commit('REMOVE_EVALUATION', evaluation);
    return axios.delete(`/evaluations/${evaluation.id}`);
  }

  @Action
  async removeEvaluation(fileId: FileID) {
    const dbId = await InspecDataModule.loadedDatabaseIdsForFileId(fileId);
    const evaluation = this.allEvaluations.find((obj) => {
      return obj.id === dbId;
    });

    if (evaluation != undefined) {
      this.context.commit('REMOVE_EVALUATION', evaluation);
    }
  }

  @Action
  async deleteTag(tag: IEvaluationTag) {
    return axios.delete(`/evaluation-tags/${tag.id}`);
  }

  @Action
  async addTag({
    evaluation,
    tag
  }: {
    evaluation: IEvaluation;
    tag: ICreateEvaluationTag;
  }) {
    return axios.post(`/evaluation-tags/${evaluation.id}`, tag);
  }

  @Mutation
  UPDATE_PARAMS(params: IEvalPaginationParams) {
    const totalReturned = Number(params.offset) + Number(params.limit);
    const onPage = Math.ceil(
      totalReturned / 100 / (Number(params.limit) / 100)
    );
    this.page = onPage;
    this.offset = Number(params.offset);
    this.limit = Number(params.limit);
    this.order = params.order;
  }

  @Mutation
  SET_PAGED_EVALUATIONS(evaluations: IEvaluation[]) {
    this.pagedEvaluations = evaluations;
  }

  @Mutation
  SET_ALL_EVALUATION(evaluations: IEvaluation[]) {
    this.allEvaluations = evaluations;
  }

  @Mutation
  SET_ALL_EVALUATION_COUNT(evaluationsCount: number) {
    this.evaluationsCount = evaluationsCount;
  }

  // Save an evaluation or update it if is already saved.
  @Mutation
  SAVE_EVALUATION(evaluationToSave: IEvaluation) {
    let found = false;
    for (const [index, evaluation] of this.allEvaluations.entries()) {
      if (evaluationToSave.id === evaluation.id) {
        this.allEvaluations.splice(index, 1, evaluationToSave);
        found = true;
        break;
      }
    }
    if (!found) {
      this.allEvaluations.push(evaluationToSave);
    }
  }

  // Save a paged evaluation (on the selection database panel)
  // to the paged variable. Update it if is already saved.
  @Mutation
  SAVE_PAGED_EVALUATION(evaluationToSave: IEvaluation) {
    let found = false;
    for (const [index, evaluation] of this.pagedEvaluations.entries()) {
      if (evaluationToSave.id === evaluation.id) {
        this.pagedEvaluations.splice(index, 1, evaluationToSave);
        found = true;
        break;
      }
    }
    if (!found) {
      this.pagedEvaluations.push(evaluationToSave);
    }
  }

  @Mutation
  REMOVE_EVALUATION(evaluation: IEvaluation) {
    this.allEvaluations.splice(this.allEvaluations.indexOf(evaluation), 1);
  }

  @Mutation
  SET_LOADING(value: boolean) {
    if (!value) {
      document.body.style.cursor = 'default';
    }
    this.loading = value;
  }
}

export const EvaluationModule = getModule(Evaluation);
