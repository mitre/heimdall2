import Vue from "vue";
import Vuex from "vuex";
import Data from "./data_store";
import Filtered from "./data_filters";
import Lookup from "./lookup_hashes";
import SeverityCounts from "./severity_counts";
import Sidebar from "./sidebar";
import StatusCounts from "./status_counts";
import Intake from "./report_intake";

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

const store = new Vuex.Store({
  modules: {
    data: Data,
    filteredData: Filtered,
    statusCounts: StatusCounts,
    severityCounts: SeverityCounts,
    lookup: Lookup,
    intake: Intake,
    sidebar: Sidebar
  }
});
console.log(store);

export default store;
