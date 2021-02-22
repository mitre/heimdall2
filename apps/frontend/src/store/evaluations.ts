import Store from '@/store/store';
import {IEvaluation, IEvaluationTag} from '@heimdall/interfaces';
import axios, {AxiosResponse} from 'axios';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'EvaluationModule'
})
export class Evaluation extends VuexModule {
  allEvaluations: IEvaluation[] = [];

  @Action
  async getAllEvaluations(): Promise<AxiosResponse> {
    return axios.get<IEvaluation[]>('/evaluations').then((response) => {
      this.setAllEvaluations(response.data);
      return response;
    });
  }

  @Action
  findEvaluationsByIds(evaluationIds: string[]): IEvaluation[] {
    const foundEvaluations: IEvaluation[] = [];
    this.allEvaluations.forEach((evaluation) => {
      if (evaluationIds.includes(evaluation.id)) {
        foundEvaluations.push(evaluation);
      }
    });
    return foundEvaluations;
  }

  @Action
  setAllEvaluations(evaluations: IEvaluation[]) {
    this.context.commit('SET_ALL_EVALUATION', evaluations);
  }

  @Action
  async deleteEvaluation(evaluation: IEvaluation) {
    this.context.commit('REMOVE_EVALUATION', evaluation);
    return axios.delete(`/evaluations/${evaluation.id}`);
  }

  @Action({rawError: true})
  async deleteTag(tag: IEvaluationTag) {
    await axios.delete(`/evaluation-tags/${tag.id}`);
  }

  @Action({rawError: true})
  async updateTag(tag: IEvaluationTag) {
    return axios.put(`/evaluation-tags/${tag.id}`, tag);
  }

  @Action({rawError: true})
  async updateEvaluation(evaluation: IEvaluation) {
    return axios.put(`/evaluations/${evaluation.id}`, evaluation);
  }

  @Mutation
  SET_ALL_EVALUATION(evaluations: IEvaluation[]) {
    this.allEvaluations = evaluations;
  }

  @Mutation
  REMOVE_EVALUATION(evaluation: IEvaluation) {
    this.allEvaluations.splice(this.allEvaluations.indexOf(evaluation), 1);
  }
}

export const EvaluationModule = getModule(Evaluation);
