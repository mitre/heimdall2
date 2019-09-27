/**
 * Counts the severities of controls.
 */

import { Module, VuexModule, getModule } from "vuex-module-decorators";
import FilteredData, { Filter, filter_cache_key } from "@/store/data_filters";
import Store from "@/store/store";
import LRUCache from "lru-cache";
import { Severity, hdfWrapControl } from "inspecjs";
import InspecDataModule from "@/store/data_store";

// The hash that we will generally be working with herein
type SeverityHash = { [key in Severity]: number };

// Helper function for counting a status in a list of controls
function count_severities(data: FilteredData, filter: Filter): SeverityHash {
  // Remove the status filter from the control filter
  let new_filter: Filter = {
    status: undefined,
    ...filter
  };

  // Get the controls
  let controls = data.controls(new_filter);

  // Count 'em out
  let hash: SeverityHash = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  controls.forEach(c => {
    let severity: Severity = hdfWrapControl(c.data).severity;
    hash[severity] += 1;
  });

  // And we're done
  return hash;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "severityCounts"
})
class SeverityCountModule extends VuexModule {
  /** Use vuex caching to always have access to our filtered data module */
  private get filtered_data(): FilteredData {
    return getModule(FilteredData, Store);
  }

  /** Ditto to base data, for dependency purposes */
  private get inspec_data(): InspecDataModule {
    return getModule(InspecDataModule, Store);
  }

  /** Generates a hash mapping each status -> a count of its members */
  get hash(): (filter: Filter) => SeverityHash {
    // Establish our cache and dependency
    let depends: any = this.inspec_data.contextualControls;
    let cache: LRUCache<string, SeverityHash> = new LRUCache(10);

    return (filter: Filter) => {
      let id = filter_cache_key(filter);
      let cached = cache.get(id);
      // If cache hits, just return
      if (cached !== undefined) {
        return cached;
      }

      // Elsewise, generate, cache, then return
      let result = count_severities(this.filtered_data, filter);
      cache.set(id, result);
      return result;
    };
  }

  get none(): (filter: Filter) => number {
    return filter => this.hash(filter)["none"];
  }

  get low(): (filter: Filter) => number {
    return filter => this.hash(filter)["low"];
  }

  get medium(): (filter: Filter) => number {
    return filter => this.hash(filter)["medium"];
  }

  get high(): (filter: Filter) => number {
    return filter => this.hash(filter)["high"];
  }

  get critical(): (filter: Filter) => number {
    return filter => this.hash(filter)["critical"];
  }
}

export default SeverityCountModule;
