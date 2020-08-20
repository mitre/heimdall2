import Vue from 'vue';
import Vuex from 'vuex';
import {InspecData} from '@/store/data_store';
import {FilteredData} from '@/store/data_filters';
import {StatusCount} from '@/store/status_counts';
import {SeverityCount} from '@/store/severity_counts';
import {HashLookup} from '@/store/lookup_hashes';
import {InspecIntake} from '@/store/report_intake';
import {ColorHack} from '@/store/color_hack';
import {AppInfo} from '@/store/app_info';
import {Server} from './server';
import {IBackendState} from './backend';

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
  statusCounts: StatusCount;
  severityCounts: SeverityCount;
  lookup: HashLookup;
  intake: InspecIntake;
  colors: ColorHack;
  info: AppInfo;
  heimdallServer: Server;
  backend: IBackendState;
}
const store = new Vuex.Store<StoreType>({});

export default store;
