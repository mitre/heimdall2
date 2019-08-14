/**
 * Counts the statuses of controls.
 */

import { Module, VuexModule, getModule } from "vuex-module-decorators";
import FilteredData, { Filter } from "./data_filters";
import Store from "./store";
import { ControlStatus, hdfWrapControl } from "inspecjs";

// Helper function for counting a status in a list of controls
function countStatus(filter: Filter, status: ControlStatus): number {
  // Save time
  if (filter.status && filter.status !== status) {
    return 0;
  }

  // Get the controls
  let data = getModule(FilteredData, Store);
  let controls = data.controls(filter);

  // Refine our filter to the severity, and return length
  return controls.filter(c => hdfWrapControl(c.data).status === status).length;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "statusCounts"
})
class StatusCountModule extends VuexModule {
  get passed(): (filter: Filter) => number {
    return filter => countStatus(filter, "Passed");
  }

  get failed(): (filter: Filter) => number {
    return filter => countStatus(filter, "Failed");
  }

  get notApplicable(): (filter: Filter) => number {
    return filter => countStatus(filter, "Not Applicable");
  }

  get notReviewed(): (filter: Filter) => number {
    return filter => countStatus(filter, "Not Reviewed");
  }

  get profileError(): (filter: Filter) => number {
    return filter => countStatus(filter, "Profile Error");
  }

  get fromProfile(): (filter: Filter) => number {
    return filter => countStatus(filter, "From Profile");
  }

  get noData(): (filter: Filter) => number {
    return filter => countStatus(filter, "No Data");
  }
}

export default StatusCountModule;
