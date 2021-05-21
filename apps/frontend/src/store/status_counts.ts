/**
 * Counts the statuses of controls.
 */

import {
  Filter,
  FilteredData,
  FilteredDataModule,
  filter_cache_key
} from '@/store/data_filters';
import Store from '@/store/store';
import {ControlStatus} from 'inspecjs';
import LRUCache from 'lru-cache';
import {getModule, Module, VuexModule} from 'vuex-module-decorators';

// The hash that we will generally be working with herein
export type ControlStatusHash = {
  [key in ControlStatus | 'Waived']: number;
};
export type StatusHash = ControlStatusHash & {
  PassedTests: number; // from passed controls
  FailedTests: number;
  PassingTestsFailedControl: number; // number of passing tests from failed controls
  Waived: number;
};

// Helper function for counting a status in a list of controls
function count_statuses(data: FilteredData, filter: Filter): StatusHash {
  // Remove the status filter from the control filter
  const new_filter: Filter = {
    status: [],
    ...filter
  };

  // Get the controls
  const controls = data.controls(new_filter);

  // Count 'em out
  const hash: StatusHash = {
    Failed: 0,
    'From Profile': 0,
    'Not Applicable': 0,
    'Not Reviewed': 0,
    Passed: 0,
    'Profile Error': 0,
    PassedTests: 0,
    FailedTests: 0,
    PassingTestsFailedControl: 0,
    Waived: 0
  };
  controls.forEach((c) => {
    c = c.root;
    const status: ControlStatus = c.hdf.status;
    ++hash[status];
    if (status === 'Passed') {
      hash.PassedTests += (c.hdf.segments || []).length;
    } else if (status === 'Failed') {
      hash.PassingTestsFailedControl += (c.hdf.segments || []).filter(
        (s) => s.status === 'passed'
      ).length;
      hash.FailedTests += (c.hdf.segments || []).filter(
        (s) => s.status === 'failed'
      ).length;
    } else if (status === 'Not Applicable' && c.hdf.waived) {
      hash.Waived += c.hdf.segments?.length || 0;
    }
  });
  // And we're done
  return hash;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'statusCounts'
})
export class StatusCount extends VuexModule {
  /** Generates a hash mapping each status -> a count of its members */
  get hash(): (filter: Filter) => StatusHash {
    // Establish our cache and dependency
    const cache: LRUCache<string, StatusHash> = new LRUCache(30);

    return (filter: Filter) => {
      const id = filter_cache_key(filter);
      const cached = cache.get(id);
      // If cache hits, just return
      if (cached !== undefined) {
        return cached;
      }

      // Elsewise, generate, cache, then return
      const result = count_statuses(FilteredDataModule, filter);
      cache.set(id, result);
      return result;
    };
  }

  get countOf(): (filter: Filter, category: keyof StatusHash) => number {
    return (filter, category) => this.hash(filter)[category];
  }
}

export const StatusCountModule = getModule(StatusCount);
