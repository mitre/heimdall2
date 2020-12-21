import Store from '@/store/store';
import {IEvaluation, IEvaluationTag} from '@heimdall/interfaces';
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
    id: -1,
    filename: '',
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
  async saveEvaluation(): Promise<IEvaluation> {
    return axios.put(
      `/evaluations/${this.activeEvaluation.id}`,
      this.activeEvaluation
    );
  }

  @Action({rawError: true})
  addTagToActiveEvaluation() {
    axios
      .post(`/evaluation-tags/${this.activeEvaluation.id}`, this.activeTag)
      .then((response) => {
        this.context.commit('ADD_TAG', response.data);
      });
  }

  @Action
  setActiveEvaluationFilename(filename: string) {
    this.context.commit('UPDATE_FILENAME', filename);
  }

  @Action({rawError: true})
  deleteTag(tag: any) {
    this.activeEvaluation.evaluationTags?.splice(
      this.activeEvaluation.evaluationTags?.indexOf(tag)
    );
    axios.delete(`/evaluation-tags/${tag.id}`);
  }

  @Action({rawError: true})
  updateTag(tag: any) {
    axios.put(`/evaluation-tags/${tag.id}`, tag);
  }

  @Mutation
  ADD_TAG(tag: IEvaluationTag) {
    if (this.activeEvaluation.evaluationTags) {
      this.activeEvaluation.evaluationTags.push(tag);
    }
  }

  @Mutation
  SET_ACTIVE_EVALUATION(evaluation: any) {
    this.activeEvaluation = evaluation;
  }

  @Mutation
  UPDATE_FILENAME(filename: string) {
    this.activeEvaluation.filename = filename;
  }

  @Mutation
  UPDATE_TAG(filename: string) {
    this.activeEvaluation.filename = filename;
  }

  get getActiveEvaluation(): any {
    return this.activeEvaluation;
  }
}

export const EvaluationModule = getModule(Evaluation);
