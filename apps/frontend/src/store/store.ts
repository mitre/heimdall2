import Vue from 'vue';
import Vuex from 'vuex';
import InspecDataModule from '@/store/data_store';
import FilteredDataModule from '@/store/data_filters';
import StatusCountModule from '@/store/status_counts';
import SeverityCountModule from '@/store/severity_counts';
import HashLookupModule from '@/store/lookup_hashes';
import InspecIntakeModule from '@/store/report_intake';
import ColorHackModule from '@/store/color_hack';
import AppInfoModule from '@/store/app_info';
import HeimdallServerModule from './server';

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
interface StoreType {
  data: InspecDataModule;
  filteredData: FilteredDataModule;
  statusCounts: StatusCountModule;
  severityCounts: SeverityCountModule;
  lookup: HashLookupModule;
  intake: InspecIntakeModule;
  colors: ColorHackModule;
  info: AppInfoModule;
  heimdallServer: HeimdallServerModule;
}
const store = new Vuex.Store<StoreType>({});

export default store;
