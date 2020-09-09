/**
 * Counts the statuses of controls.
 */

import {Module, VuexModule, getModule} from 'vuex-module-decorators';
import {
  FilteredData,
  Filter,
  filter_cache_key,
  FilteredDataModule
} from '@/store/data_filters';
import Store from '@/store/store';
import LRUCache from 'lru-cache';
import {ControlStatus} from 'inspecjs';

// The hash that we will generally be working with herein
export type ControlStatusHash = {[key in ControlStatus]: number};
export type StatusHash = ControlStatusHash & {
  PassedTests: number; // from passed controls
  FailedTests: number;
  FailedOutOf: number; // total tests from failed controls
  NotApplicableTests: number;
  NotReviewedTests: number;
  ErroredOutOf: number;
  ErroredTests: number;
  TotalTests: number;
};

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
    'From Profile': 0,
    'Not Applicable': 0,
    'Not Reviewed': 0,
    Passed: 0,
    'Profile Error': 0,
    PassedTests: 0,
    FailedTests: 0,
    FailedOutOf: 0,
    NotApplicableTests: 0,
    NotReviewedTests: 0,
    ErroredOutOf: 0,
    ErroredTests: 0,
    TotalTests: 0
  };
  controls.forEach(c => {
    c = c.root;
    let status: ControlStatus = c.hdf.status;
    hash[status] += 1;
    hash.TotalTests += (c.hdf.segments || []).length;
    if (status == 'Passed') {
      hash.PassedTests += (c.hdf.segments || []).length;
    } else if (status == 'Failed') {
      hash.FailedOutOf += (c.hdf.segments || []).length;
      hash.FailedTests += (c.hdf.segments || []).filter(
        s => s.status == 'failed'
      ).length;
    } else if (status == 'Not Applicable') {
      hash.NotApplicableTests += (c.hdf.segments || []).length;
    } else if (status == 'Not Reviewed') {
      hash.NotReviewedTests += (c.hdf.segments || []).length;
    } else if (status == 'Profile Error') {
      hash.ErroredOutOf += (c.hdf.segments || []).length;
      hash.ErroredTests += (c.hdf.segments || []).filter(
        s => s.status == 'error'
      ).length;
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
    let cache: LRUCache<string, StatusHash> = new LRUCache(30);

    return (filter: Filter) => {
      let id = filter_cache_key(filter);
      let cached = cache.get(id);
      // If cache hits, just return
      if (cached !== undefined) {
        return cached;
      }

      // Elsewise, generate, cache, then return
      let result = count_statuses(FilteredDataModule, filter);
      cache.set(id, result);
      return result;
    };
  }

  get countOf(): (filter: Filter, category: keyof StatusHash) => number {
    return (filter, category) => this.hash(filter)[category];
  }
}

export const StatusCountModule = getModule(StatusCount);
