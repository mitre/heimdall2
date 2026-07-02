/**
 * Counts the severities of controls.
 */

import type { Severity } from 'inspecjs';
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
type SeverityHash = Record<Severity, number>;

// Helper function for counting a status in a list of controls
function count_severities(data: FilteredData, filter: Filter): SeverityHash {
  // Remove the status filter from the control filter
  const newFilter: Filter = {
    status: [],
    ...filter,
  };

  // Get the controls
  const controls = data.controls(newFilter);

  // Count 'em out
  const hash: SeverityHash = {
    critical: 0,
    high: 0,
    low: 0,
    medium: 0,
    none: 0,
  };
  for (const c of controls) {
    const severity: Severity = c.root.hdf.severity;
    hash[severity] += 1;
  }

  // And we're done
  return hash;
}

@Module({
  dynamic: true,
  name: 'severityCounts',
  namespaced: true,
  store: Store,
})
export class SeverityCount extends VuexModule {
  get critical(): (filter: Filter) => number {
    return filter => this.hash(filter).critical;
  }

  /** Generates a hash mapping each status -> a count of its members */
  get hash(): (filter: Filter) => SeverityHash {
    // Establish our cache and dependency
    const cache = new LRUCache<string, SeverityHash>({ max: 30 });

    return (filter: Filter) => {
      const id = filter_cache_key(filter);
      const cached = cache.get(id);
      // If cache hits, just return
      if (cached !== undefined) {
        return cached;
      }

      // Elsewise, generate, cache, then return
      const result = count_severities(FilteredDataModule, filter);
      cache.set(id, result);
      return result;
    };
  }

  get high(): (filter: Filter) => number {
    return filter => this.hash(filter).high;
  }

  get low(): (filter: Filter) => number {
    return filter => this.hash(filter).low;
  }

  get medium(): (filter: Filter) => number {
    return filter => this.hash(filter).medium;
  }

  get none(): (filter: Filter) => number {
    return filter => this.hash(filter).none;
  }
}

export const SeverityCountModule = getModule(SeverityCount);
