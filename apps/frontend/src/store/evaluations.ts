import Store from '@/store/store';
import {
  ICreateEvaluationTag,
  IEvaluation,
  IEvaluationTag
} from '@heimdall/interfaces';
import axios from 'axios';
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
  findEvaluationsByIds(evaluationIds: string[]): IEvaluation[] {
    const loadedFiles = InspecDataModule.allFiles.map((file) =>
      file.database_id?.toString()
    );
    return this.allEvaluations.filter(
      (evaluation) =>
        evaluationIds.includes(evaluation.id) &&
        !loadedFiles.includes(evaluation.id)
    );
  }

  @Action
  async load_results(
    evaluations: {
      id: string;
    }[]
  ): Promise<(FileID | void)[]> {
    return Promise.all(
      evaluations.map(async (evaluation) => {
        return axios
          .get<IEvaluation>(`/evaluations/${evaluation.id}`)
          .then(async ({data}) => {
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
