import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

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
  notify(message: string) {
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

  @Action
  // Axios doesn't seem to have a defined type for errors outside of Axios which
  // is possibly undefined, this is also being remo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTTPFailure(error: any) {
    if (typeof error.response.data.message === 'object') {
      this.notify(
        error.response.data.message
          .map(function capitalize(c: string) {
            return c.charAt(0).toUpperCase() + c.slice(1);
          })
          .join(', ')
      );
    } else {
      this.failure(error.response.data.message);
    }
  }

  @Action
  visibility(visibility: boolean) {
    this.context.commit('SET_VISIBILITY', visibility);
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
