/**
 * Counts the statuses of controls.
 */

import type { HDFControlSegment } from 'inspecjs';
import { ControlStatus } from 'inspecjs';
import { LRUCache } from 'lru-cache';
import { getModule, Module, VuexModule } from 'vuex-module-decorators';
import {
  Filter,
  filter_cache_key,
  FilteredData,
  FilteredDataModule,
} from '@/store/data_filters';
import Store from '@/store/store';

// The hash that we will generally be working with herein
export type ControlStatusHash = Record<'Waived' | ControlStatus, number>;
export type StatusHash = ControlStatusHash & {
  FailedTests: number;
  PassedTests: number; // from passed controls
  PassingTestsFailedControl: number; // number of passing tests from failed controls
  Waived: number;
};

export function calculateCompliance(filter: Filter) {
  const passed = StatusCountModule.countOf(filter, 'Passed');
  const total
    = passed
      + StatusCountModule.countOf(filter, 'Failed')
      + StatusCountModule.countOf(filter, 'Profile Error')
      + StatusCountModule.countOf(filter, 'Not Reviewed');
  if (total === 0) {
    return 0;
  }
  return (100 * passed) / total;
}

// Helper function for counting a status in a list of controls
function count_statuses(data: FilteredData, filter: Filter): StatusHash {
  // Remove the status filter from the control filter
  const newFilter: Filter = {
    status: [],
    ...filter,
  };

  // Get the controls
  const controls = data.controls(newFilter);

  // Count 'em out
  const hash: StatusHash = {
    Failed: 0,
    FailedTests: 0,
    'From Profile': 0,
    'Not Applicable': 0,
    'Not Reviewed': 0,
    Passed: 0,
    PassedTests: 0,
    PassingTestsFailedControl: 0,
    'Profile Error': 0,
    Waived: 0,
  };
  for (let c of controls) {
    c = c.root;
    const status: ControlStatus = c.hdf.status;
    ++hash[status];
    if (status === 'Passed') {
      hash.PassedTests += (c.hdf.segments || []).length;
    } else if (status === 'Failed') {
      hash.PassingTestsFailedControl += (c.hdf.segments || []).filter(
        (s: HDFControlSegment) => s.status === 'passed',
      ).length;
      hash.FailedTests += (c.hdf.segments || []).filter(
        (s: HDFControlSegment) => s.status === 'failed',
      ).length;
    } else if (status === 'Not Applicable' && c.hdf.waived) {
      hash.Waived += c.hdf.segments?.length || 0;
    }
  }
  // And we're done
  return hash;
}

@Module({
  dynamic: true,
  name: 'statusCounts',
  namespaced: true,
  store: Store,
})
export class StatusCount extends VuexModule {
  get countOf(): (filter: Filter, category: keyof StatusHash) => number {
    return (filter, category) => this.hash(filter)[category];
  }

  /** Generates a hash mapping each status -> a count of its members */
  get hash(): (filter: Filter) => StatusHash {
    // Establish our cache and dependency
    const cache = new LRUCache<string, StatusHash>({ max: 30 });

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
}

export const StatusCountModule = getModule(StatusCount);
