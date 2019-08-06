/**
 * Counts the severities of controls.
 */

import { Module, VuexModule, getModule } from "vuex-module-decorators";
import FilteredData, { Filter } from "./data_filters";
import Store from "./store";
import { Severity, hdfWrapControl } from "inspecjs";

// Helper function for counting a severity in a list of controls
function countSeverity(filter: Filter, severity: Severity): number {
  // Save time
  if (filter.severity && filter.severity !== severity) {
    return 0;
  }

  // Get the controls
  let data = getModule(FilteredData, Store);
  let controls = data.controls(filter);

  // Refine our filter to the severity, and return length
  return controls.filter(c => hdfWrapControl(c.data).severity === severity)
    .length;
}

@Module({
  namespaced: true,
  name: "severityCounts"
})
class SeverityCountModule extends VuexModule {
  get none(): (filter: Filter) => number {
    return filter => countSeverity(filter, "none");
  }

  get low(): (filter: Filter) => number {
    return filter => countSeverity(filter, "low");
  }

  get medium(): (filter: Filter) => number {
    return filter => countSeverity(filter, "medium");
  }

  get high(): (filter: Filter) => number {
    return filter => countSeverity(filter, "high");
  }

  get critical(): (filter: Filter) => number {
    return filter => countSeverity(filter, "critical");
  }
}

export default SeverityCountModule;
