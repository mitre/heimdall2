import Store from '@/store/store';
import {
  ICreateEvaluationTag,
  IEvaluation,
  IEvaluationTag,
  IEvalPaginationParams,
  IEvaluationResponse
} from '@heimdall/interfaces';
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
  evaluationsCount: number = 0;
  loading = true;

  get evaluationForFile(): Function {
    return (file: EvaluationFile | ProfileFile) => {
      try {
        return this.allEvaluations.find((e) => {
          return e.id === file.database_id?.toString();
        });
      } catch(err) {
        return false;
      }
    };
  }

  get totalEvaluation(): Function {
    return () => {this.evaluationsCount}
  }
  // @Action
  // async getAllEvaluations(): Promise<void> {
  //   return axios
  //     .get<IEvaluation[]>('/evaluations')
  //     .then(({data}) => {
  //       this.context.commit('SET_ALL_EVALUATION', data);
  //     })
  //     .finally(() => {
  //       this.context.commit('SET_LOADING', false);
  //     });
  // }

  @Action
  async getAllEvaluations(params: IEvalPaginationParams): Promise<void> {
    console.log(`evaluations.ts -> params are: ${JSON.stringify(params,null,2)}`)    
    return axios
      //.get<IEvaluation[]>('/evaluations', {params})
      .get<IEvaluationResponse>('/evaluations', {params})
      .then(({data}) => {
        const { totalCount, evaluations } = data;

        console.log(`evaluations.ts -> SET_ALL_EVALUATION -> data is: ${JSON.stringify(data.evaluations,null,2)}`)
        console.log(`evaluations.ts -> SET_ALL_EVALUATION_COUNT 1-> data is: ${JSON.stringify(data.totalCount,null,2)}`)
        console.log(`evaluations.ts -> SET_ALL_EVALUATION_COUNT 2-> data is: ${JSON.stringify(totalCount,null,2)}`)

        console.log(`evaluations.ts -> this.evaluationsCount 1-> data is: ${this.evaluationsCount}`)

        this.context.commit('SET_ALL_EVALUATION', evaluations);
        this.context.commit('SET_ALL_EVALUATION_COUNT', totalCount);

        console.log(`evaluations.ts -> this.evaluationsCount 2-> data is: ${this.evaluationsCount}`)
      })
      .finally(() => {
        this.context.commit('SET_LOADING', false);
      });
  }

  // @Action
  // async getAllEvalsPagination(params: IEvalPaginationParams): Promise<void> {
  //   return axios
  //     .get<IEvaluation[]>('/evaluations', { params })
  //     .then(({data}) => {
  //       this.context.commit('SET_ALL_EVALUATION', data);
  //     })
  //     .finally(() => {
  //       this.context.commit('SET_LOADING', false);
  //     });
  // }

  @Action
  async load_results(evaluationIds: string[]): Promise<(FileID | void)[]> {
    const unloadedIds = _.difference(
      evaluationIds,
      InspecDataModule.loadedDatabaseIds
    );
    const loadedIds: FileID[] = [];
    await Promise.all(
      unloadedIds.map(async (id) =>
        this.loadEvaluation(id)
          .then(async (evaluation) => {
            if (await InspecIntakeModule.isHDF(evaluation.data)) {
console.log(`evaluations.ts load_results() -> ID isHDF: ${id} `),
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
console.log(`ID IS NOT isHDF: ${id} `)
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
    return loadedIds;
  }

  @Action
  async loadEvaluation(id: string) {
    return axios.get<IEvaluation>(`/evaluations/${id}`).then(({data}) => {
      this.context.commit('SAVE_EVALUATION', data);
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
