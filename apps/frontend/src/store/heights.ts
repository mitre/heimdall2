import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

export interface IHeightsState {
  topbarHeight: number;
  controlTableHeaderHeight: number;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'Heights'
})
export class Heights extends VuexModule implements IHeightsState {
  topbarHeight = 0;
  controlTableHeaderHeight = 0;

  @Mutation
  SET_TOPBAR_HEIGHT(value: number) {
    this.topbarHeight = value;
  }

  @Mutation
  SET_CONTROL_TABLE_HEADER_HEIGHT(value: number) {
    this.controlTableHeaderHeight = value;
  }

  @Action
  public setTopbarHeight(value: number) {
    this.context.commit('SET_TOPBAR_HEIGHT', value);
  }

  @Action
  public setControlTableHeaderHeight(value: number) {
    this.context.commit('SET_CONTROL_TABLE_HEADER_HEIGHT', value);
  }
}

export const HeightsModule = getModule(Heights);
