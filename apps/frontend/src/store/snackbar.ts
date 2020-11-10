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
    this.SET_ERROR(false);
    this.SET_MESSAGE(message);
    this.SET_VISIBILITY(true);
  }
  @Action
  failure(message: string) {
    this.SET_ERROR(true);
    this.SET_MESSAGE(message);
    this.SET_VISIBILITY(true);
  }
  @Action
  visibility(visibility: boolean) {
    this.SET_VISIBILITY(visibility);
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
