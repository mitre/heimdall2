import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule,
} from 'vuex-module-decorators';
import Store from '@/store/store';

export type IHeightsState = {
  controlTableHeaderHeight: number;
  topbarHeight: number;
};

@Module({
  dynamic: true,
  name: 'Heights',
  namespaced: true,
  store: Store,
})
export class Heights extends VuexModule implements IHeightsState {
  controlTableHeaderHeight = 0;
  topbarHeight = 0;

  @Mutation
  SET_CONTROL_TABLE_HEADER_HEIGHT(value: number) {
    this.controlTableHeaderHeight = value;
  }

  @Mutation
  SET_TOPBAR_HEIGHT(value: number) {
    this.topbarHeight = value;
  }

  @Action
  public setControlTableHeaderHeight(value: number | undefined) {
    if (value) {
      this.context.commit('SET_CONTROL_TABLE_HEADER_HEIGHT', value);
    }
  }

  @Action
  public setTopbarHeight(value: number) {
    this.context.commit('SET_TOPBAR_HEIGHT', value);
  }
}

export const HeightsModule = getModule(Heights);
