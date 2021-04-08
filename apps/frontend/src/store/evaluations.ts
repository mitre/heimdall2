import Store from '@/store/store';
import {
  ICreateEvaluationTag,
  IEvaluation,
  IEvaluationTag
} from '@heimdall/interfaces';
import axios from 'axios';
import _ from 'lodash';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {InspecDataModule} from './data_store';
import {FileID, InspecIntakeModule} from './report_intake';
import {SnackbarModule} from './snackbar';

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'EvaluationModule'
})
export class Evaluation extends VuexModule {
  allEvaluations: IEvaluation[] = [];
  loading = true;

  @Action
  async getAllEvaluations(): Promise<void> {
    return axios
      .get<IEvaluation[]>('/evaluations')
      .then(({data}) => {
        this.context.commit('SET_ALL_EVALUATION', data);
      })
      .finally(() => {
        this.context.commit('SET_LOADING', false);
      });
  }

  @Action
  async load_results(evaluationIds: string[]): Promise<(FileID | void)[]> {
    const unloadedIds = _.difference(
      evaluationIds,
      InspecDataModule.loadedDatabaseIds
    );
    return Promise.all(
      unloadedIds.map(async (id) => {
        return axios
          .get<IEvaluation>(`/evaluations/${id}`)
          .then(async ({data}) => {
            this.addEvaluation(data);
            return InspecIntakeModule.loadText({
              text: JSON.stringify(data.data),
              filename: data.filename,
              database_id: data.id,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              tags: [] // Tags are not yet implemented, so for now the value is passed in empty
            }).catch((err) => {
              SnackbarModule.failure(err);
            });
          })
          .catch((err) => {
            SnackbarModule.failure(err);
          });
      })
    );
  }

  @Action
  async addEvaluation(evaluation: IEvaluation) {
    this.context.commit('ADD_EVALUATION', evaluation);
  }

  @Action
  async updateEvaluation(evaluation: IEvaluation) {
    return axios.put(`/evaluations/${evaluation.id}`, evaluation);
  }

  @Action
  async deleteEvaluation(evaluation: IEvaluation) {
    this.context.commit('REMOVE_EVALUATION', evaluation);
    return axios.delete(`/evaluations/${evaluation.id}`);
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
  SET_ALL_EVALUATION(evaluations: IEvaluation[]) {
    this.allEvaluations = evaluations;
  }

  @Mutation
  ADD_EVALUATION(evaluation: IEvaluation) {
    this.allEvaluations.push(evaluation);
  }

  @Mutation
  REMOVE_EVALUATION(evaluation: IEvaluation) {
    this.allEvaluations.splice(this.allEvaluations.indexOf(evaluation), 1);
  }

  @Mutation
  SET_LOADING(value: boolean) {
    this.loading = value;
  }

  get allEvaluationTags(): string[] {
    return this.allEvaluations.flatMap((evaluation) => {
      return evaluation.evaluationTags.map((tag) => tag.value);
    });
  }
}

export const EvaluationModule = getModule(Evaluation);
