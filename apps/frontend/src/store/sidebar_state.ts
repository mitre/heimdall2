/**
 * This module maintains the state of the sidebar between different pages.
 */

import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

export interface ISidebarState {
  active: boolean;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'SidebarState'
})
export class SidebarState extends VuexModule implements ISidebarState {
  active = false;

  @Mutation
  SET_ACTIVE(state: boolean) {
    this.active = state;
  }

  @Action
  public UpdateActive(state: boolean): void {
    this.SET_ACTIVE(state);
  }
}

export const SidebarModule = getModule(SidebarState);
