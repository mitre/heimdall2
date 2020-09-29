import {
  Module,
  VuexModule,
  Mutation,
  Action,
  getModule
} from 'vuex-module-decorators';
import Store from '@/store/store';

export interface ISnackbarState {
  message: string;
  error: boolean;
  show: boolean;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'SnackbarModule'
})
export class Snackbar extends VuexModule {
  message = '';
  error = false;
  show = false;
  @Action
  success(message: string) {
    this.context.commit('SET_ERROR', false);
    this.context.commit('SET_MESSAGE', message);
    this.context.commit('SET_VISIBILITY', true);
  }
  @Action
  failure(message: string) {
    this.context.commit('SET_ERROR', true);
    this.context.commit('SET_MESSAGE', message);
    this.context.commit('SET_VISIBILITY', true);
  }
  @Mutation
  SET_ERROR(error: boolean) {
    this.error = error;
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

export const SnackbarModule = getModule(Snackbar);
