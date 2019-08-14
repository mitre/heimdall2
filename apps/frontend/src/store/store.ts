import Vue from "vue";
import Vuex from "vuex";
import InspecDataModule from "./data_store";
import FilteredDataModule from "./data_filters";
import StatusCountModule from "./status_counts";
import SeverityCountModule from "./severity_counts";
import HashLookupModule from "./lookup_hashes";
import InspecIntakeModule from "./report_intake";
import SidebarModule from "./sidebar";
import ColorHackModule from "./color_hack";

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
  sidebar: SidebarModule;
  colors: ColorHackModule;
}
const store = new Vuex.Store<StoreType>({});

console.log(store);

export default store;
