import {
  Module,
  VuexModule,
  Action,
  Mutation,
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

  success(message: string) {
    this.error = false;
    this.message = message;
    this.show = true;
  }

  failure(message: string) {
    this.error = true;
    this.message = message;
    this.show = true;
  }

  @Mutation
  SET_MESSAGE(message: string) {
    this.message = message;
  }

  @Mutation
  SHOW_SNACKBAR(message: string) {
    this.show = true;
  }
}

export const SnackbarModule = getModule(Snackbar);
