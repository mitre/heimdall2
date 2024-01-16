import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

export interface ISpinnerState {
  message: string;
  show: boolean;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'SpinnerModule'
})
export class Spinner extends VuexModule {
  message = 'Loading...';
  show = false;

  @Action
  visibility(visibility: boolean) {
    this.context.commit('SET_VISIBILITY', visibility);
  }

  @Action
  setMessage(msg: string) {
    this.context.commit('SET_MESSAGE', msg);
  }

  @Mutation
  SET_MESSAGE(message: string) {
    this.message = message;
  }

  @Mutation
  SET_VISIBILITY(visibility: boolean) {
    this.show = visibility;
  }
}

export const SpinnerModule = getModule(Spinner);
