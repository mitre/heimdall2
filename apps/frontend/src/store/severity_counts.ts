/**
 * Counts the severities of controls.
 */

import {
  Filter,
  FilteredData,
  FilteredDataModule,
  filter_cache_key
} from '@/store/data_filters';
import Store from '@/store/store';
import {Severity} from 'inspecjs';
import LRUCache from 'lru-cache';
import {getModule, Module, VuexModule} from 'vuex-module-decorators';

// The hash that we will generally be working with herein
type SeverityHash = {[key in Severity]: number};

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
  controls.forEach((c) => {
    let severity: Severity = c.root.hdf.severity;
    hash[severity] += 1;
  });

  // And we're done
  return hash;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'severityCounts'
})
export class SeverityCount extends VuexModule {
  /** Generates a hash mapping each status -> a count of its members */
  get hash(): (filter: Filter) => SeverityHash {
    // Establish our cache and dependency
    let cache: LRUCache<string, SeverityHash> = new LRUCache(30);

    return (filter: Filter) => {
      let id = filter_cache_key(filter);
      let cached = cache.get(id);
      // If cache hits, just return
      if (cached !== undefined) {
        return cached;
      }

      // Elsewise, generate, cache, then return
      let result = count_severities(FilteredDataModule, filter);
      cache.set(id, result);
      return result;
    };
  }

  get none(): (filter: Filter) => number {
    return (filter) => this.hash(filter)['none'];
  }

  get low(): (filter: Filter) => number {
    return (filter) => this.hash(filter)['low'];
  }

  get medium(): (filter: Filter) => number {
    return (filter) => this.hash(filter)['medium'];
  }

  get high(): (filter: Filter) => number {
    return (filter) => this.hash(filter)['high'];
  }

  get critical(): (filter: Filter) => number {
    return (filter) => this.hash(filter)['critical'];
  }
}

export const SeverityCountModule = getModule(SeverityCount);
