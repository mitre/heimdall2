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
  value: number;
  show: boolean;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'SpinnerModule'
})
export class Spinner extends VuexModule implements ISpinnerState {
  message = 'Loading...';
  value = 0;
  show = false;

  @Action
  reset() {
    this.context.commit('SET_MESSAGE', 'Loading...');
    this.context.commit('SET_VALUE', 0);
  }

  @Action
  visibility(visibility: boolean) {
    this.context.commit('SET_VISIBILITY', visibility);
  }

  @Action
  setMessage(msg: string) {
    this.context.commit('SET_MESSAGE', msg);
  }

  @Action
  setValue(value: number) {
    this.context.commit('SET_VALUE', value);
  }

  @Mutation
  SET_MESSAGE(message: string) {
    this.message = message;
  }

  @Mutation
  SET_VALUE(value: number) {
    this.value = value;
  }

  @Mutation
  SET_VISIBILITY(visibility: boolean) {
    this.show = visibility;
  }
}

export const SpinnerModule = getModule(Spinner);
