import Vue from 'vue';
import Vuex from 'vuex';
import { config } from 'vuex-module-decorators';
import type { IAppInfoState } from '@/store/app_info';
import type { ColorHack } from '@/store/color_hack';
import type { FilteredData } from '@/store/data_filters';
import type { InspecData } from '@/store/data_store';
import type { IGroupState } from '@/store/groups';
import type { InspecIntake } from '@/store/report_intake';
import type { IServerState } from '@/store/server';
import type { SeverityCount } from '@/store/severity_counts';
import type { ISidebarState } from '@/store/sidebar_state';
import type { ISpinnerState } from '@/store/spinner';
import type { StatusCount } from '@/store/status_counts';
import type { IHeightsState } from './heights';

config.rawError = true;

Vue.use(Vuex);

/**
 * The core store for all of our components.
 *
 * The store itself is kept as small as possible to minimize
 * the impacts of breaking changes. If you want to add new getters,
 * do so as a module. Recall that mapState and mapGetter are your friends
 * if your code is getting too long.
 *
 * Furthermore, remember that if a piece of data is used ONLY in your
 * component, it does not need to be here.
 * EG: Filtered controls are useful almost everywhere, whereas
 * the current page of a datatable probably isn't. Be sensible
 */
export type StoreType = {
  colors: ColorHack;
  data: InspecData;
  filteredData: FilteredData;
  groups: IGroupState;
  heights: IHeightsState;
  info: IAppInfoState;
  intake: InspecIntake;
  server: IServerState;
  severityCounts: SeverityCount;
  sidebar: ISidebarState;
  spinner: ISpinnerState;
  statusCounts: StatusCount;
};
const store = new Vuex.Store<StoreType>({});

export default store;
