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
      .catch((err) => {
        SnackbarModule.failure(`${err}. Please reload the page and try again.`);
      })
      .finally(() => {
        this.context.commit('SET_LOADING', false);
      });
  }

  @Action({rawError: true})
  async updateEvaluation(evaluation: IEvaluation) {
    return axios.put(`/evaluations/${evaluation.id}`, evaluation);
  }

  @Action({rawError: true})
  async deleteEvaluation(evaluation: IEvaluation) {
    this.context.commit('REMOVE_EVALUATION', evaluation);
    return axios.delete(`/evaluations/${evaluation.id}`);
  }

  @Action({rawError: true})
  async deleteTag(tag: IEvaluationTag) {
    return axios.delete(`/evaluation-tags/${tag.id}`);
  }

  @Action({rawError: true})
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
