/**
 * Counts the statuses of controls.
 */

import { Module, VuexModule, getModule } from "vuex-module-decorators";
import FilteredData, { Filter, filter_cache_key } from "@/store/data_filters";
import Store from "@/store/store";
import LRUCache from "lru-cache";
import { ControlStatus, hdfWrapControl } from "inspecjs";
import InspecDataModule from "@/store/data_store";

// The hash that we will generally be working with herein
type StatusHash = { [key in ControlStatus]: number };

// Helper function for counting a status in a list of controls
function count_statuses(data: FilteredData, filter: Filter): StatusHash {
  // Remove the status filter from the control filter
  let new_filter: Filter = {
    status: undefined,
    ...filter
  };

  // Get the controls
  let controls = data.controls(new_filter);

  // Count 'em out
  let hash: StatusHash = {
    Failed: 0,
    "From Profile": 0,
    "No Data": 0,
    "Not Applicable": 0,
    "Not Reviewed": 0,
    Passed: 0,
    "Profile Error": 0
  };
  controls.forEach(c => {
    let status: ControlStatus = hdfWrapControl(c.data).status;
    hash[status] += 1;
  });

  // And we're done
  return hash;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "statusCounts"
})
class StatusCountModule extends VuexModule {
  /** Use vuex caching to always have access to our filtered data module */
  private get filtered_data(): FilteredData {
    return getModule(FilteredData, Store);
  }

  /** Ditto to base data, for dependency purposes */
  private get inspec_data(): InspecDataModule {
    return getModule(InspecDataModule, Store);
  }

  /** Generates a hash mapping each status -> a count of its members */
  get hash(): (filter: Filter) => StatusHash {
    // Establish our cache and dependency
    let depends: any = this.inspec_data.contextualControls;
    let cache: LRUCache<string, StatusHash> = new LRUCache(10);

    return (filter: Filter) => {
      let id = filter_cache_key(filter);
      let cached = cache.get(id);
      // If cache hits, just return
      if (cached !== undefined) {
        return cached;
      }

      // Elsewise, generate, cache, then return
      let result = count_statuses(this.filtered_data, filter);
      cache.set(id, result);
      return result;
    };
  }

  get passed(): (filter: Filter) => number {
    return filter => this.hash(filter)["Passed"];
  }

  get failed(): (filter: Filter) => number {
    return filter => this.hash(filter)["Failed"];
  }

  get notApplicable(): (filter: Filter) => number {
    return filter => this.hash(filter)["Not Applicable"];
  }

  get notReviewed(): (filter: Filter) => number {
    return filter => this.hash(filter)["Not Reviewed"];
  }

  get profileError(): (filter: Filter) => number {
    return filter => this.hash(filter)["Profile Error"];
  }

  get fromProfile(): (filter: Filter) => number {
    return filter => this.hash(filter)["From Profile"];
  }

  get noData(): (filter: Filter) => number {
    return filter => this.hash(filter)["No Data"];
  }
}

export default StatusCountModule;
