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
import {LRUCache} from 'lru-cache';
import {getModule, Module, VuexModule} from 'vuex-module-decorators';

// The hash that we will generally be working with herein
type SeverityHash = Record<Severity, number>;

// Helper function for counting a status in a list of controls
function count_severities(data: FilteredData, filter: Filter): SeverityHash {
  // Remove the status filter from the control filter
  const newFilter: Filter = {
    status: [],
    ...filter
  };

  // Get the controls
  const controls = data.controls(newFilter);

  // Counted through a Map: the severity string comes from the parsed scan
  // file, so the Severity type is a boundary lie — a hostile or malformed
  // value used to become an own NaN entry on the hash (undefined + 1) or be
  // lost to the prototype setter. Unknown values now simply do not count.
  const counts = new Map<Severity, number>();
  controls.forEach((c) => {
    const severity: Severity = c.root.hdf.severity;
    counts.set(severity, (counts.get(severity) ?? 0) + 1);
  });

  return {
    none: counts.get('none') ?? 0,
    low: counts.get('low') ?? 0,
    medium: counts.get('medium') ?? 0,
    high: counts.get('high') ?? 0,
    critical: counts.get('critical') ?? 0
  };
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
    const cache = new LRUCache<string, SeverityHash>({max: 30});

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

  get none(): (filter: Filter) => number {
    return (filter) => this.hash(filter).none;
  }

  get low(): (filter: Filter) => number {
    return (filter) => this.hash(filter).low;
  }

  get medium(): (filter: Filter) => number {
    return (filter) => this.hash(filter).medium;
  }

  get high(): (filter: Filter) => number {
    return (filter) => this.hash(filter).high;
  }

  get critical(): (filter: Filter) => number {
    return (filter) => this.hash(filter).critical;
  }
}

export const SeverityCountModule = getModule(SeverityCount);
