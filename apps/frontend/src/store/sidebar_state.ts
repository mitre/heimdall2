/**
 * This module maintains the state of the sidebar between different pages.
 */

import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule,
} from 'vuex-module-decorators';
import Store from '@/store/store';

export type ISidebarState = { active: boolean };

@Module({
  dynamic: true,
  name: 'SidebarState',
  namespaced: true,
  store: Store,
})
export class SidebarState extends VuexModule implements ISidebarState {
  active = false;

  @Mutation
  SET_ACTIVE(state: boolean) {
    this.active = state;
  }

  @Action
  public UpdateActive(state: boolean): void {
    this.context.commit('SET_ACTIVE', state);
  }
}

export const SidebarModule = getModule(SidebarState);
