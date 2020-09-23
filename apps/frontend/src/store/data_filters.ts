/**
 * This module provides a cached, reusable method for filtering data from data_store.
 */

import {Module, VuexModule, getModule, Mutation} from 'vuex-module-decorators';
import {SourcedContextualizedEvaluation, FileID} from '@/store/report_intake';
import {InspecDataModule, isFromProfileFile} from '@/store/data_store';

import {ControlStatus, Severity, context, nist} from 'inspecjs';
import Store from '@/store/store';
import LRUCache from 'lru-cache';

const MAX_CACHE_ENTRIES = 20;

/** Contains common filters on data from the store. */
export interface Filter {
  // General
  /** Which file these objects came from. Undefined => any */
  fromFile: FileID[];

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
  context_control: context.ContextualizedControl,
  term: string
): boolean {
  let as_hdf = context_control.root.hdf;
  // Get our (non-null) searchable data
  let searchables: string[] = [
    as_hdf.wraps.id,
    as_hdf.wraps.title,
    as_hdf.wraps.code,
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
  name: 'filteredData'
})
export class FilteredData extends VuexModule {
  selected_file_ids: FileID[] = [];

  @Mutation
  set_toggle_file_on(file: FileID): void {
    if (this.selected_file_ids.includes(file)) {
      return;
    }
    this.selected_file_ids.push(file);
  }

  @Mutation
  set_toggle_file_off(file: FileID): void {
    let checked = this.selected_file_ids.indexOf(file);
    if (checked !== -1) {
      this.selected_file_ids.splice(checked, 1);
    }
  }

  // Just override the whole list
  @Mutation
  set_toggled_files(files: FileID[]): void {
    this.selected_file_ids.length = 0;
    this.selected_file_ids.splice(0, this.selected_file_ids.length, ...files);
  }

  /**
   * Parameterized getter.
   * Get all evaluations from the specified file ids
   */
  get evaluations(): (
    files: FileID[]
  ) => readonly SourcedContextualizedEvaluation[] {
    return (files: FileID[]) => {
      return InspecDataModule.contextualExecutions.filter(e =>
        files.includes(e.from_file.unique_id)
      );
    };
  }

  /**
   * Parameterized getter.
   * Get all profiles from the specified file ids.
   * Filters only based on the file ID
   */
  get profiles(): (
    files: FileID[]
  ) => readonly context.ContextualizedProfile[] {
    return (files: FileID[]) => {
      // Initialize our list to add valid profiles to
      let profiles: context.ContextualizedProfile[] = [];

      // Filter to those that match our filter. In this case that just means come from the right file id
      InspecDataModule.contextualProfiles.forEach(prof => {
        if (isFromProfileFile(prof)) {
          if (files.includes(prof.from_file.unique_id)) {
            profiles.push(prof);
          }
        } else {
          // Its a report; go two levels up to get its file
          let ev = prof.sourced_from as SourcedContextualizedEvaluation;
          if (files.includes(ev.from_file.unique_id)) {
            profiles.push(prof);
          }
        }
      });

      return profiles;
    };
  }

  /* get the currently select evaluations */
  get selected_evaluations(): number[] {
    const fileIds = [...this.selected_file_ids];
    const files = InspecDataModule.allProfileFiles;

    return fileIds.filter(fileId =>
      files.every(file => fileId !== file.unique_id)
    );
  }

  /* get the currently selected profiles */
  get selected_profiles(): number[] {
    const fileIds = [...this.selected_file_ids];
    const files = InspecDataModule.allEvaluationFiles;

    return fileIds.filter(fileId =>
      files.every(file => fileId !== file.unique_id)
    );
  }

  // check to see if all profiles are selected
  get all_toggled_profiles(): boolean {
    return (
      this.selected_profiles.length == InspecDataModule.allProfileFiles.length
    );
  }

  // check to see if all evaluations are selected
  get all_toggled_evaluations(): boolean {
    return (
      this.selected_evaluations.length ==
      InspecDataModule.allEvaluationFiles.length
    );
  }

  /**
   * Parameterized getter.
   * Get all controls from all profiles from the specified file id.
   * Utlizes the profiles getter to accelerate the file filter.
   */
  get controls(): (filter: Filter) => readonly context.ContextualizedControl[] {
    /** Cache by filter */
    const localCache: LRUCache<
      string,
      readonly context.ContextualizedControl[]
    > = new LRUCache(MAX_CACHE_ENTRIES);

    return (filter: Filter) => {
      // Generate a hash for cache purposes.
      // If the "search_term" string is not null, we don't cache - no need to pollute
      let id: string = filter_cache_key(filter);

      // Check if we have this cached:
      let cached = localCache.get(id);
      if (cached !== undefined) {
        return cached;
      }

      // First get all of the profiles using the same filter
      let profiles: readonly context.ContextualizedProfile[];
      let controls: readonly context.ContextualizedControl[];
      // Get profiles
      profiles = this.profiles(filter.fromFile);
      // And all the controls they contain
      controls = profiles.flatMap(profile => profile.contains);

      // Filter by control id
      if (filter.control_id !== undefined) {
        controls = controls.filter(c => c.data.id === filter.control_id);
      }

      // Filter by status, if necessary
      if (filter.status !== undefined) {
        controls = controls.filter(
          control => control.root.hdf.status === filter.status
        );
      }

      // Filter by severity, if necessary
      if (filter.severity !== undefined) {
        controls = controls.filter(
          control => control.root.hdf.severity === filter.severity
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
          return c.root.hdf.parsed_nist_tags.some(t => control.contains(t));
        });
      }

      // Freeze and save to cache
      let r = Object.freeze(controls);
      localCache.set(id, r);
      return r;
    };
  }
}

export const FilteredDataModule = getModule(FilteredData);

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
    new_search = '';
  }

  let new_f: Filter = {
    search_term: new_search,
    omit_overlayed_controls: f.omit_overlayed_controls || false,
    ...f
  };
  return JSON.stringify(new_f);
}
