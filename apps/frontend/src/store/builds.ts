import Store from '@/store/store';
import {
  IBuild,
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

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'BuildModule'
})
export class Build extends VuexModule {
  allBuilds: IBuild[] = [];
  loading = true;

  @Action
  async getAllBuilds(): Promise<void> {
    return axios
      .get<IBuild[]>('/builds')
      .then(({data}) => {
        this.context.commit('SET_ALL_PRODUCT', data);
      })
      .finally(() => {
        this.context.commit('SET_LOADING', false);
      });
  }

  @Mutation
  SET_ALL_PRODUCT(products: IBuild[]) {
    this.allBuilds = products;
  }

  @Mutation
  SET_LOADING(value: boolean) {
    this.loading = value;
  }
}

export const BuildModule = getModule(Build);
