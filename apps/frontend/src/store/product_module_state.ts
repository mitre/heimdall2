import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

import {
  IBuild,
} from '@heimdall/interfaces';
import axios from 'axios';
import {EvaluationModule} from '@/store/evaluations';
import _ from 'lodash';
import {BucketType} from '@/enums/bucket_type';
import {SearchModule} from '@/store/search';

export interface PASDViewModeType {
  id: number;
  text: string;
}

export interface IProductModState {
  viewMode: number;
  displayNewControls: boolean; // display only new controls in UI (i.e. control rules without override information)
  overrideValidation: boolean;
  s3Prefix: string;
}

function updateS3Prefix(product: string, build: string): string {
  return  product + "/" + build + "/"
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'ProductModuleState'
})
class ProductModState extends VuexModule implements IProductModState {
  viewMode = 0;
  viewObjectStoreKey = "noset"
  viewBuildId = "notset"
  s3Prefix = "notset"
  displayNewControls = false;
  overrideValidation = false;

  viewModeTypes: PASDViewModeType[] = [
    { id: 0, text: 'Certifier'},
    { id: 1, text: 'Developer'},
    { id: 2, text: 'Cyber'},
  ];

  bucketList: number[] = new Array(BucketType.MaxSize)
  @Mutation
  SET_OVERRIDE_VALIDATION(state: boolean) {
    this.overrideValidation = state;
  }

  @Action
  public UpdateOverrideValidation(state: boolean): void {
    this.context.commit('SET_OVERRIDE_VALIDATION', state);
  }

  @Mutation
  SET_DISPLAY_NEW_CONTROLS(state: boolean) {
    this.displayNewControls = state;
  }

  @Action
  public UpdateDisplayNewControls(state: boolean): void {
    this.context.commit('SET_DISPLAY_NEW_CONTROLS', state);
  }

  @Mutation
  SET_VIEW_MODE(state: number) {
    switch (this.viewMode) {
      case 2:
        SearchModule.removeStatusFilter('Pending');
    }
    this.viewMode = state;
  }

  @Action
  public UpdateViewMode(state: number): void {
    this.context.commit('SET_VIEW_MODE', state);
  }

  @Mutation
  SET_VIEW_OBJECTSTORE_KEY(val: string) {
    this.viewObjectStoreKey = val;
    this.s3Prefix = updateS3Prefix(this.viewObjectStoreKey, this.viewBuildId)
  }

  @Action
  public UpdateViewObjectStoreKey(val: string): void {
    this.context.commit('SET_VIEW_OBJECTSTORE_KEY', val);
  }

  @Mutation
  SET_VIEW_BUILD_ID(val: string) {
    this.viewBuildId = val;
    this.s3Prefix = updateS3Prefix(this.viewObjectStoreKey, this.viewBuildId);
  }

  @Action
  UpdateViewBuildId(val: string): void {
    this.context.commit("SET_VIEW_BUILD_ID", val);
  }

  @Action
  async LoadBuild(id: string) {
    return axios.get<IBuild>(`/builds/${id}`).then(({data}) => {
      this.context.commit('LOAD_BUILD', data);
      return data;
    });
  }

  // Save an evaluation or update it if is already saved.
  @Mutation
  LOAD_BUILD(buildEvals: IBuild) {
    const evalsToLoad: string[] = []

    if (buildEvals !== undefined) {
      if (buildEvals.evaluations.length > 0) {
        for (const [index, evaluation] of buildEvals.evaluations.entries()) {
          evalsToLoad.push(evaluation.id)
        }
      }
    }

    if (evalsToLoad.length > 0) {
      EvaluationModule.clear_quiet_results()
      EvaluationModule.load_quiet_results(evalsToLoad)
    }
  }

}

export const ProductModuleState = getModule(ProductModState);
