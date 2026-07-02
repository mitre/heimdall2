import * as _ from 'lodash';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule,
} from 'vuex-module-decorators';
import Store from '@/store/store';

export type ISnackbarState = {
  error: boolean;
  message: string;
  show: boolean;
};

@Module({
  dynamic: true,
  name: 'SnackbarModule',
  namespaced: true,
  store: Store,
})
export class Snackbar extends VuexModule {
  error = false;
  message = '';
  show = false;

  @Action
  failure(message: string) {
    this.context.commit('SET_VISIBILITY', false);
    this.context.commit('SET_ERROR', true);
    this.context.commit('SET_MESSAGE', message);
    this.context.commit('SET_VISIBILITY', true);
  }

  @Action
  HTTPFailure(error: unknown) {
    const nestedError = _.get(error, 'response.data.message') as
      | null
      | string[]
      | undefined;
    if (
      nestedError !== null
      && nestedError !== undefined
      && _.isArray(nestedError)
    ) {
      this.failure(
        nestedError
          .map(function capitalize(c: string) {
            return c.charAt(0).toUpperCase() + c.slice(1);
          })
          .join(', '),
      );
    } else {
      this.failure(`${nestedError || error}`);
    }
  }

  @Action
  notify(message: string) {
    this.context.commit('SET_VISIBILITY', false);
    this.context.commit('SET_ERROR', false);
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

  @Action
  visibility(visibility: boolean) {
    this.context.commit('SET_VISIBILITY', visibility);
  }
}

export const SnackbarModule = getModule(Snackbar);
