import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

export interface ISnackbarState {
  customText: string;
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
  customText: string | undefined = '';
  message = '';
  error = false;
  updateBar = false;
  show = false;

  @Action
  notify(message: string) {
    this.SET_ERROR(false);
    this.SET_UPDATE(false);
    this.SET_MESSAGE(message);
    this.SET_VISIBILITY(true);
  }
  @Action
  failure(message: string) {
    this.SET_ERROR(true);
    this.SET_UPDATE(false);
    this.SET_MESSAGE(message);
    this.SET_VISIBILITY(true);
  }
  @Action
  update(newest: string) {
    this.SET_ERROR(false);
    this.SET_UPDATE(true);
    this.SET_MESSAGE(
      `There is a new version of Heimdall available (${newest}).`
    );
    this.SET_VISIBILITY(true);
  }
  @Action
  visibility(visibility: boolean) {
    this.SET_VISIBILITY(visibility);
  }

  @Mutation
  SET_CUSTOM_TEXT(customText?: string) {
    this.customText = customText;
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

  @Mutation
  SET_UPDATE(updateBar: boolean) {
    this.updateBar = updateBar;
  }
}

export const SnackbarModule = getModule(Snackbar);
