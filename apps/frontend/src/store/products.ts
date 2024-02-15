import Store from '@/store/store';
import {
  IProduct,
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
  name: 'ProductModule'
})
export class Product extends VuexModule {
  allProducts: IProduct[] = [];
  selectedBuilds: IBuild[] = [];
  loading = true;

  @Action
  async getAllProducts(): Promise<void> {
    return axios
      .get<IProduct[]>('/products')
      .then(({data}) => {
        this.context.commit('SET_ALL_PRODUCT', data);
      })
      .finally(() => {
        this.context.commit('SET_LOADING', false);
      });
  }

  @Action
  async getSelectedProductBuilds(id: string): Promise<void> {
    return axios
    .get<IBuild[]>(`/products/${id}/builds`)
    .then(({data}) => {
      this.context.commit('SET_ALL_BUILDS', data);
    })
    .finally(() => {
      this.context.commit('SET_LOADING', false);
    });
  }

  @Mutation
  SET_ALL_PRODUCT(products: IProduct[]) {
    this.allProducts = products;
  }

  @Mutation
  SET_ALL_BUILDS(products: IBuild[]) {
    this.selectedBuilds = products;
  }

  @Mutation
  SET_LOADING(value: boolean) {
    this.loading = value;
  }
}

export const ProductModule = getModule(Product);
