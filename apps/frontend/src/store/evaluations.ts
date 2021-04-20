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
        return this.loadEvaluation(id)
          .then(async (evaluation) => {
            return InspecIntakeModule.loadText({
              text: JSON.stringify(evaluation.data),
              filename: evaluation.filename,
              database_id: evaluation.id,
              createdAt: evaluation.createdAt,
              updatedAt: evaluation.updatedAt,
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
  async loadEvaluation(id: string) {
    return axios.get<IEvaluation>(`/evaluations/${id}`).then(({data}) => {
      this.context.commit('SAVE_EVALUTION', data);
      return data;
    });
  }

  @Action
  async updateEvaluation(evaluation: IEvaluation) {
    return axios
      .put<IEvaluation>(`/evaluations/${evaluation.id}`, evaluation)
      .then(({data}) => {
        this.context.commit('SAVE_EVALUTION', data);
        return data;
      });
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

  // Save an evaluation or update it if it is already saved.
  @Mutation
  SAVE_EVALUTION(evaluationToSave: IEvaluation) {
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
