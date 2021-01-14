import Store from '@/store/store';
import {ICreateEvaluationTag, IEvaluation} from '@heimdall/interfaces';
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
  allEvaluations: IEvaluation[] = [];
  activeEvaluation: number = -1;

  @Action
  setAllEvaluations(evaluations: IEvaluation[]) {
    this.context.commit('SET_ALL_EVALUATION', evaluations);
  }

  @Action
  setActiveEvaluation(evaluation: IEvaluation) {
    const evaluationIndex = this.allEvaluations.indexOf(evaluation);
    this.context.commit('SET_ACTIVE_EVALUATION', evaluationIndex);
  }

  get activeFilename() {
    return this.allEvaluations[this.activeEvaluation]?.filename || '';
  }

  get activeTags() {
    return this.allEvaluations[this.activeEvaluation]?.evaluationTags || [];
  }

  @Action
  async deleteEvaluation() {
    this.context.commit('REMOVE_EVALUATION');
    return axios.delete(
      `/evaluations/${this.allEvaluations[this.activeEvaluation].id}`
    );
  }

  @Action
  async commitTag(tag: ICreateEvaluationTag) {
    return axios.post(
      `/evaluation-tags/${this.allEvaluations[this.activeEvaluation].id}`,
      tag
    );
  }

  @Action({rawError: true})
  async addTagToActiveEvaluation(tag: any) {
    this.context.commit('ADD_TAG', tag);
  }

  @Action
  setActiveEvaluationFilename(filename: string) {
    this.context.commit('UPDATE_FILENAME', filename);
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
      .put(
        `/evaluations/${this.allEvaluations[this.activeEvaluation].id}`,
        this.allEvaluations[this.activeEvaluation]
      )
      .then((response) => {
        this.context.commit('SET_ACTIVE_EVALUATION', response.data);
      });
  }

  @Mutation
  SET_ALL_EVALUATION(evaluations: IEvaluation[]) {
    this.allEvaluations = evaluations;
  }

  @Mutation
  SET_ACTIVE_EVALUATION(index: number) {
    this.activeEvaluation = index;
  }

  @Mutation
  UPDATE_FILENAME(filename: string) {
    this.allEvaluations[this.activeEvaluation].filename = filename;
  }

  @Mutation
  REMOVE_EVALUATION() {
    this.allEvaluations.splice(this.activeEvaluation, 1);
  }

  @Mutation
  ADD_TAG(tag: any) {
    this.allEvaluations[this.activeEvaluation].evaluationTags?.push(tag);
  }

  @Mutation
  REMOVE_TAG(tag: any) {
    const activeTagIndex: number =
      this.allEvaluations[this.activeEvaluation].evaluationTags?.indexOf(tag) ||
      -1;
    this.allEvaluations[this.activeEvaluation].evaluationTags?.splice(
      activeTagIndex,
      1
    );
  }

  get getActiveEvaluation(): any {
    return this.allEvaluations[this.activeEvaluation];
  }
}

export const EvaluationModule = getModule(Evaluation);
