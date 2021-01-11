import Store from '@/store/store';
import {IEvaluation} from '@heimdall/interfaces';
import axios from 'axios';
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
  activeEvaluation: IEvaluation = {
    id: '',
    filename: '',
    userId: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {},
    evaluationTags: []
  };
  activeTag: any = {};

  @Action
  setActiveEvaluation(evaluation: any) {
    this.context.commit('SET_ACTIVE_EVALUATION', evaluation);
  }

  @Action
  async deleteEvaluation() {
    return axios.delete(`/evaluations/${this.activeEvaluation.id}`);
  }

  @Action({rawError: true})
  async addTagToActiveEvaluation() {
    return axios.post(
      `/evaluation-tags/${this.activeEvaluation.id}`,
      this.activeTag
    );
  }

  @Action
  setActiveEvaluationFilename(filename: string) {
    return this.context.commit('UPDATE_FILENAME', filename);
  }

  @Action({rawError: true})
  async deleteTag(tag: any) {
    await axios.delete(`/evaluation-tags/${tag.id}`);
  }

  @Action({rawError: true})
  async updateTag(tag: any) {
    return axios.put(`/evaluation-tags/${tag.id}`, tag);
  }

  @Action({rawError: true})
  async updateEvaluation() {
    return axios
      .put(`/evaluations/${this.activeEvaluation.id}`, this.activeEvaluation)
      .then((response) => {
        this.context.commit('SET_ACTIVE_EVALUATION', response.data);
      });
  }

  @Mutation
  SET_ACTIVE_EVALUATION(evaluation: any) {
    this.activeEvaluation = evaluation;
  }

  @Mutation
  UPDATE_FILENAME(filename: string) {
    this.activeEvaluation.filename = filename;
  }

  get getActiveEvaluation(): any {
    return this.activeEvaluation;
  }
}

export const EvaluationModule = getModule(Evaluation);
