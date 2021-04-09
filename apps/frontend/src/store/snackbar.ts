import Store from '@/store/store';
import _ from 'lodash';
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
    this.context.commit('SET_VISIBILITY', false);
    this.context.commit('SET_ERROR', false);
    this.context.commit('SET_MESSAGE', message);
    this.context.commit('SET_VISIBILITY', true);
  }

  @Action
  failure(message: string) {
    this.context.commit('SET_VISIBILITY', false);
    this.context.commit('SET_ERROR', true);
    this.context.commit('SET_MESSAGE', message);
    this.context.commit('SET_VISIBILITY', true);
  }

  @Action
  HTTPFailure(error: unknown) {
    const nestedError = _.get(error, 'response.data.message');
    if (typeof nestedError === 'object') {
      this.failure(
        nestedError
          .map(function capitalize(c: string) {
            return c.charAt(0).toUpperCase() + c.slice(1);
          })
          .join(', ')
      );
    } else {
      this.failure(nestedError || error);
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
