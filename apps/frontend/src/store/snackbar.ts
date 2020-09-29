import {Module, VuexModule, Mutation, getModule} from 'vuex-module-decorators';
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
  @Mutation
  success(message: string) {
    this.error = false;
    this.message = message;
    this.show = true;
  }
  @Mutation
  failure(message: string) {
    this.error = true;
    this.message = message;
    this.show = true;
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
