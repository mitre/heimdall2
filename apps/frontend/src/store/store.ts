import {IAppInfoState} from '@/store/app_info';
import {ColorHack} from '@/store/color_hack';
import {FilteredData} from '@/store/data_filters';
import {InspecData} from '@/store/data_store';
import {IGroupState} from '@/store/groups';
import {InspecIntake} from '@/store/report_intake';
import {IServerState} from '@/store/server';
import {SeverityCount} from '@/store/severity_counts';
import {ISidebarState} from '@/store/sidebar_state';
import {ISpinnerState} from '@/store/spinner';
import {StatusCount} from '@/store/status_counts';
import Vue from 'vue';
import Vuex from 'vuex';
import {config} from 'vuex-module-decorators';
import {IHeightsState} from './heights';

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
export interface StoreType {
  data: InspecData;
  filteredData: FilteredData;
  heights: IHeightsState;
  statusCounts: StatusCount;
  severityCounts: SeverityCount;
  intake: InspecIntake;
  colors: ColorHack;
  info: IAppInfoState;
  server: IServerState;
  sidebar: ISidebarState;
  groups: IGroupState;
  spinner: ISpinnerState;
}
const store = new Vuex.Store<StoreType>({});

export default store;
