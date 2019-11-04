/**
 * This module provides a cached, reusable method for filtering data from data_store.
 */

import { Module, VuexModule, getModule } from "vuex-module-decorators";
import DataModule, {
  ContextualizedProfile,
  ContextualizedControl
} from "@/store/data_store";
import {
  ControlStatus,
  Severity,
  hdfWrapControl as hdf,
  hdfWrapControl
} from "inspecjs";
import { FileID, isInspecFile } from "@/store/report_intake";
import Store from "@/store/store";
import LRUCache from "lru-cache";
import { nist } from "inspecjs";

const MAX_CACHE_ENTRIES = 20;

/** Contains common filters on data from the store. */
export interface Filter {
  // General
  /** Which file these objects came from. Undefined => any */
  fromFile?: FileID;

  // Control specific
  /** What status the controls can have. Undefined => any */
  status?: ControlStatus;

  /** What severity the controls can have. Undefined => any */
  severity?: Severity;

  /** Whether or not to allow/include overlayed controls */
  omit_overlayed_controls?: boolean;

  /** A search term string, case insensitive
   * We look for this in
   * - control ID
   * - rule title
   * - severity
   * - status
   * - finding details (from HDF)
   * - code
   */
  search_term?: string;

  /** The current state of the Nist Treemap. Used to further filter by nist categories etc. */
  tree_filters?: TreeMapState;

  /** A specific control id */
  control_id?: string;
}

export type TreeMapState = string[]; // Representing the current path spec, from root

/**
 * Facillitates the search functionality
 * @param term The string to search with
 * @param context_control The control to search for term in
 */
function contains_term(
  context_control: ContextualizedControl,
  term: string
): boolean {
  let control = context_control.data;
  let as_hdf = hdf(control);
  // Get our (non-null) searchable data
  let searchables: string[] = [
    control.id,
    control.title,
    control.code,
    as_hdf.severity,
    as_hdf.status,
    as_hdf.finding_details
  ].filter(s => s !== null) as string[];

  // See if any contain term
  return searchables.some(s => s.toLowerCase().includes(term));
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "filteredData"
})
class FilteredDataModule extends VuexModule {
  private get dataStore(): DataModule {
    return getModule(DataModule, Store);
  }

  /**
   * Parameterized getter.
   * Get all profiles from the specified file id.
   * Filters only based on the file ID
   */
  get profiles(): (file: FileID) => readonly ContextualizedProfile[] {
    // Setup a cache for this run
    const depends = this.dataStore.contextualProfiles;
    const localCache: LRUCache<FileID, ContextualizedProfile[]> = new LRUCache(
      MAX_CACHE_ENTRIES
    );

    return (file: FileID) => {
      // Generate a cache id
      let cached = localCache.get(file);
      if (cached !== undefined) {
        return cached;
      }

      // Initialize our list to add valid profiles to
      let profiles: ContextualizedProfile[] = [];

      // Filter to those that match our filter. In this case that just means come from the right file id
      this.dataStore.contextualProfiles.forEach(prof => {
        if (isInspecFile(prof.sourced_from)) {
          if (prof.sourced_from.unique_id === file) {
            profiles.push(prof);
          }
        } else {
          // Its a report; go two levels up to get its file
          if (prof.sourced_from.sourced_from.unique_id === file) {
            profiles.push(prof);
          }
        }
      });

      return profiles;
    };
  }

  /**
   * Parameterized getter.
   * Get all controls from all profiles from the specified file id.
   * Utlizes the profiles getter to accelerate the file filter.
   */
  get controls(): (filter: Filter) => readonly ContextualizedControl[] {
    /** Cache by filter */
    const depends = this.dataStore.contextualControls;
    const localCache: LRUCache<
      string,
      readonly ContextualizedControl[]
    > = new LRUCache(MAX_CACHE_ENTRIES);

    return (filter: Filter = {}) => {
      // Generate a hash for cache purposes.
      // If the "search_term" string is not null, we don't cache - no need to pollute
      let id: string = filter_cache_key(filter);

      // Check if we have this cached:
      let cached = localCache.get(id);
      if (cached !== undefined) {
        return cached;
      }

      // First get all of the profiles using the same filter
      let profiles: readonly ContextualizedProfile[];
      let controls: readonly ContextualizedControl[];
      if (filter.fromFile !== undefined) {
        // Get profiles
        profiles = this.profiles(filter.fromFile);
        // And all the controls they contain
        controls = profiles.flatMap(profile => profile.contains);
      } else {
        // No file filter => we don't care about profile. Jump directly to the full control list
        controls = this.dataStore.contextualControls;
      }

      // Filter by control id
      if (filter.control_id !== undefined) {
        controls = controls.filter(c => c.data.id === filter.control_id);
      }

      // Filter by status, if necessary
      if (filter.status !== undefined) {
        controls = controls.filter(
          control => hdf(control.data).status === filter.status
        );
      }

      // Filter by severity, if necessary
      if (filter.severity !== undefined) {
        controls = controls.filter(
          control => hdf(control.data).severity === filter.severity
        );
      }

      // Filter by overlay
      if (filter.omit_overlayed_controls) {
        controls = controls.filter(control => control.extended_by.length === 0);
      }

      // Filter by search term
      if (filter.search_term !== undefined) {
        let term = filter.search_term.toLowerCase();

        // Filter controls to those that contain search term
        controls = controls.filter(c => contains_term(c, term));
      }

      // Filter by nist stuff
      if (filter.tree_filters && filter.tree_filters.length > 0) {
        // Shorthand the nist filters
        let f = filter.tree_filters;

        // Construct a nist control to represent the filter
        let control = new nist.NistControl(filter.tree_filters);

        controls = controls.filter(c => {
          // Get an hdf version so we have the fixed nist tags
          let as_hdf = hdfWrapControl(c.data);

          return as_hdf.parsed_nist_tags.some(t => control.contains(t));
        });
      }

      // Freeze and save to cache
      let r = Object.freeze(controls);
      localCache.set(id, r);
      return r;
    };
  }
}

export default FilteredDataModule;

/**
 * Generates a unique string to represent a filter.
 * Does some minor "acceleration" techniques such as
 * - annihilating empty search terms
 * - defaulting "omit_overlayed_controls"
 */
export function filter_cache_key(f: Filter) {
  // fix the search term
  let new_search: string;
  if (f.search_term !== undefined) {
    new_search = f.search_term.trim();
  } else {
    new_search = "";
  }

  let new_f: Filter = {
    search_term: new_search,
    omit_overlayed_controls: f.omit_overlayed_controls || false,
    ...f
  };
  return JSON.stringify(new_f);
}
