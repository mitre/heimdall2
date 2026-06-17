import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule,
} from 'vuex-module-decorators';
import Store from '@/store/store';

export type ISpinnerState = {
  message: string;
  show: boolean;
  value: number;
};

@Module({
  dynamic: true,
  name: 'SpinnerModule',
  namespaced: true,
  store: Store,
})
export class Spinner extends VuexModule implements ISpinnerState {
  message = 'Loading...';
  show = false;
  value = 0;

  @Action
  reset() {
    this.context.commit('SET_MESSAGE', 'Loading...');
    this.context.commit('SET_VALUE', 0);
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

  @Action
  setMessage(msg: string) {
    this.context.commit('SET_MESSAGE', msg);
  }

  @Action
  setValue(value: number) {
    this.context.commit('SET_VALUE', value);
  }

  @Action
  visibility(visibility: boolean) {
    this.context.commit('SET_VISIBILITY', visibility);
  }
}

export const SpinnerModule = getModule(Spinner);
