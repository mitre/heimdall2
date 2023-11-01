import Store from '@/store/store';
import * as _ from 'lodash';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

export interface ISnackbarState {
  linkUrl: string;
  linkText: string;
  message: string;
  error: boolean;
  warn: boolean;
  show: boolean;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'SnackbarModule'
})
export class Snackbar extends VuexModule {
  linkUrl = '';
  linkText = '';
  message = '';
  error = false;
  warn = false;
  show = false;

  @Action
  notify(message: string) {
    this.context.commit('SET_VISIBILITY', false);
    this.context.commit('SET_ERROR', false);
    this.context.commit('SET_WARN', false);
    this.context.commit('SET_MESSAGE', message);
    this.context.commit('SET_VISIBILITY', true);
  }

  @Action
  warning(message: string) {
    this.context.commit('SET_VISIBILITY', false);
    this.context.commit('SET_ERROR', false);
    this.context.commit('SET_WARN', true);
    this.context.commit('SET_MESSAGE', message);
    //this.context.commit('SET_LINK_URL', linkUrl);
    //this.context.commit('SET_LINK_TEXT', linkText);
    this.context.commit('SET_VISIBILITY', true);
  }

  @Action
  failure(message: string) {
    this.context.commit('SET_VISIBILITY', false);
    this.context.commit('SET_ERROR', true);
    this.context.commit('SET_WARN', false);
    this.context.commit('SET_MESSAGE', message);
    this.context.commit('SET_VISIBILITY', true);
  }

  @Action
  HTTPFailure(error: unknown) {
    const nestedError = _.get(error, 'response.data.message') as
      | string[]
      | undefined
      | null;
    if (
      nestedError !== null &&
      nestedError !== undefined &&
      _.isArray(nestedError)
    ) {
      this.failure(
        nestedError
          .map(function capitalize(c: string) {
            return c.charAt(0).toUpperCase() + c.slice(1);
          })
          .join(', ')
      );
    } else {
      this.failure(`${nestedError || error}`);
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
  SET_WARN(warn: boolean) {
    this.warn = warn;
  }

  @Mutation
  SET_MESSAGE(message: string) {
    this.message = message;
  }

  @Mutation
  SET_LINK_URL(linkUrl: string) {
    this.linkUrl = linkUrl;
  }

  @Mutation
  SET_LINK_TEXT(linkText: string) {
    this.linkText = linkText;
  }

  @Mutation
  SET_VISIBILITY(visibility: boolean) {
    this.show = visibility;
  }
}

export const SnackbarModule = getModule(Snackbar);
