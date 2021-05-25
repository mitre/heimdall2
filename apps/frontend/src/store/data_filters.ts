/**
 * This module provides a cached, reusable method for filtering data from data_store.
 */

import {Trinary} from '@/enums/Trinary';
import {InspecDataModule} from '@/store/data_store';
import {
  FileID,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import Store from '@/store/store';
import {context, nist, Severity} from 'inspecjs';
import LRUCache from 'lru-cache';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

const MAX_CACHE_ENTRIES = 20;

export declare type ExtendedControlStatus =
  | 'Not Applicable'
  | 'From Profile'
  | 'Profile Error'
  | 'Passed'
  | 'Failed'
  | 'Not Reviewed'
  | 'Waived';

/** Contains common filters on data from the store. */
export interface Filter {
  // General
  /** Which file these objects came from. Undefined => any */
  fromFile: FileID[];

  // Control specific
  /** What status the controls can have. Undefined => any */
  status?: ExtendedControlStatus[];

  /** What severity the controls can have. Undefined => any */
  severity?: Severity[];

  /** Whether or not to allow/include overlayed controls */
  omit_overlayed_controls?: boolean;

  /** Control IDs to search for */
  ids?: string[];

  /** Titles to search for */
  titleSearchTerms?: string[];

  /** Descriptions to search for */
  descriptionSearchTerms?: string[];

  /** CCIs to search for */
  cciIdFilter?: string[];

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
  const as_hdf = context_control.root.hdf;
  // Get our (non-null) searchable data
  const searchables: string[] = [
    as_hdf.wraps.id,
    as_hdf.wraps.title,
    as_hdf.wraps.code,
    as_hdf.severity,
    as_hdf.status,
    as_hdf.finding_details
  ].filter((s) => s !== null) as string[];

  // See if any contain term
  return searchables.some((s) => s.toLowerCase().includes(term));
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'filteredData'
})
export class FilteredData extends VuexModule {
  selectedEvaluationIds: FileID[] = [];
  selectedProfileIds: FileID[] = [];

  @Mutation
  SELECT_EVALUATIONS(files: FileID[]): void {
    this.selectedEvaluationIds = [
      ...new Set([...files, ...this.selectedEvaluationIds])
    ];
  }

  @Mutation
  SELECT_PROFILES(files: FileID[]): void {
    this.selectedProfileIds = [
      ...new Set([...files, ...this.selectedProfileIds])
    ];
  }

  @Mutation
  CLEAR_EVALUATION(removeId: FileID): void {
    this.selectedEvaluationIds = this.selectedEvaluationIds.filter(
      (ids) => ids !== removeId
    );
  }

  @Mutation
  CLEAR_PROFILE(removeId: FileID): void {
    this.selectedProfileIds = this.selectedProfileIds.filter(
      (ids) => ids !== removeId
    );
  }

  @Mutation
  CLEAR_ALL_EVALUATIONS(): void {
    this.selectedEvaluationIds = [];
  }

  @Mutation
  CLEAR_ALL_PROFILES(): void {
    this.selectedProfileIds = [];
  }

  @Action
  public toggle_all_evaluations(): void {
    if (this.all_evaluations_selected === Trinary.On) {
      this.CLEAR_ALL_EVALUATIONS();
    } else {
      this.SELECT_EVALUATIONS(
        InspecDataModule.allEvaluationFiles.map((v) => v.unique_id)
      );
    }
  }

  @Action
  public toggle_all_profiles(): void {
    if (this.all_profiles_selected === Trinary.On) {
      this.CLEAR_ALL_PROFILES();
    } else {
      this.SELECT_PROFILES(
        InspecDataModule.allProfileFiles.map((v) => v.unique_id)
      );
    }
  }

  @Action
  public select_exclusive_evaluation(fileID: FileID): void {
    this.CLEAR_ALL_EVALUATIONS();
    this.SELECT_EVALUATIONS([fileID]);
  }

  @Action
  public select_exclusive_evaluations(fileIDs: FileID[]): void {
    this.CLEAR_ALL_EVALUATIONS();
    this.SELECT_EVALUATIONS(fileIDs);
  }

  @Action
  public select_exclusive_profile(fileID: FileID): void {
    this.CLEAR_ALL_PROFILES();
    this.SELECT_PROFILES([fileID]);
  }

  @Action
  public select_exclusive_profiles(fileIDs: FileID[]): void {
    this.CLEAR_ALL_PROFILES();
    this.SELECT_PROFILES(fileIDs);
  }

  @Action
  public toggle_evaluation(fileID: FileID): void {
    if (this.selectedEvaluationIds.includes(fileID)) {
      this.CLEAR_EVALUATION(fileID);
    } else {
      this.SELECT_EVALUATIONS([fileID]);
    }
  }

  @Action
  public toggle_profile(fileID: FileID): void {
    if (this.selectedProfileIds.includes(fileID)) {
      this.CLEAR_PROFILE(fileID);
    } else {
      this.SELECT_PROFILES([fileID]);
    }
  }

  @Action
  public clear_file(fileID: FileID): void {
    this.CLEAR_EVALUATION(fileID);
    this.CLEAR_PROFILE(fileID);
  }

  /**
   * Parameterized getter.
   * Get all evaluations from the specified file ids
   */
  get evaluations(): (
    files: FileID[]
  ) => readonly SourcedContextualizedEvaluation[] {
    return (files: FileID[]) => {
      return InspecDataModule.contextualExecutions.filter((e) =>
        files.includes(e.from_file.unique_id)
      );
    };
  }

  get profiles_for_evaluations(): (
    files: FileID[]
  ) => readonly context.ContextualizedProfile[] {
    return (files: FileID[]) => {
      // Filter to those that match our filter. In this case that just means come from the right file id
      return this.evaluations(files).flatMap(
        (evaluation) => evaluation.contains
      );
    };
  }

  /**
   * Parameterized getter.
   * Get all profiles from the specified file ids.
   */
  get profiles(): (files: FileID[]) => readonly SourcedContextualizedProfile[] {
    return (files: FileID[]) => {
      return InspecDataModule.contextualProfiles.filter((e) => {
        return files.includes(e.from_file.unique_id);
      });
    };
  }

  get selected_file_ids(): FileID[] {
    return [...this.selectedEvaluationIds, ...this.selectedProfileIds];
  }

  // check to see if all profiles are selected
  get all_profiles_selected(): Trinary {
    switch (this.selectedProfileIds.length) {
      case 0:
        return Trinary.Off;
      case InspecDataModule.allProfileFiles.length:
        return Trinary.On;
      default:
        return Trinary.Mixed;
    }
  }

  // check to see if all evaluations are selected
  get all_evaluations_selected(): Trinary {
    switch (this.selectedEvaluationIds.length) {
      case 0:
        return Trinary.Off;
      case InspecDataModule.allEvaluationFiles.length:
        return Trinary.On;
      default:
        return Trinary.Mixed;
    }
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
      const id: string = filter_cache_key(filter);

      // Check if we have this cached:
      const cached = localCache.get(id);
      if (cached !== undefined) {
        return cached;
      }

      // Get profiles from loaded Results
      let profiles: readonly context.ContextualizedProfile[] =
        this.profiles_for_evaluations(filter.fromFile);

      // Get profiles from loaded Profiles
      profiles = profiles.concat(this.profiles(filter.fromFile));

      // And all the controls they contain
      let controls: readonly context.ContextualizedControl[] = profiles.flatMap(
        (profile) => profile.contains
      );
      // Filter by control id
      if (filter.control_id !== undefined) {
        controls = controls.filter((c) => c.data.id === filter.control_id);
      }

      // Filter by status
      if (filter.status?.length !== 0) {
        const foundControls: context.ContextualizedControl[] = [];
        filter.status?.forEach(async (statusFilter) => {
          if (statusFilter === 'Waived') {
            foundControls.push(
              ...controls.filter((control) => control.hdf.waived)
            );
          } else {
            foundControls.push(
              ...controls.filter((control) =>
                filter.status?.includes(control.root.hdf.status)
              )
            );
          }
        });
        controls = foundControls.filter((c, index) => {
          return foundControls.indexOf(c) === index;
        });
      }

      // Filter by severity
      if (filter.severity?.length !== 0) {
        controls = controls.filter(
          (control) =>
            filter.severity?.indexOf(control.root.hdf.severity) !== -1
        );
      }

      // Filter by control ID
      if (filter.ids?.length !== 0) {
        const foundControls: context.ContextualizedControl[] = [];
        filter.ids?.forEach((filter) => {
          foundControls.push(
            ...controls.filter((control) => {
              return control.hdf.wraps.id.indexOf(filter) !== -1;
            })
          );
        });
        controls = foundControls.filter((c, index) => {
          return foundControls.indexOf(c) === index;
        });
      }

      // Filter by title
      if (filter.titleSearchTerms?.length !== 0) {
        const foundControls: context.ContextualizedControl[] = [];
        filter.titleSearchTerms?.forEach((term) => {
          foundControls.push(
            ...controls.filter((control) => {
              return control.hdf.wraps.title?.toLowerCase().includes(term);
            })
          );
        });
        controls = foundControls.filter((c, index) => {
          return foundControls.indexOf(c) === index;
        });
      }

      // Filter by description
      if (filter.descriptionSearchTerms?.length !== 0) {
        const foundControls: context.ContextualizedControl[] = [];
        filter.descriptionSearchTerms?.forEach((term) => {
          foundControls.push(
            ...controls.filter((control) => {
              return control.hdf.wraps.desc?.toLowerCase().includes(term);
            })
          );
        });
        controls = foundControls.filter((c, index) => {
          return foundControls.indexOf(c) === index;
        });
      }

      // Filter by CCI ID
      if (filter.cciIdFilter?.length !== 0) {
        const foundControls: context.ContextualizedControl[] = [];
        filter.cciIdFilter?.forEach((cciID) => {
          controls.forEach((control) => {
            if (
              control.hdf.raw_nist_tags.some((tag) => {
                return tag.toLowerCase().indexOf(cciID) !== -1;
              })
            ) {
              foundControls.push(control);
            }
          });
        });
        controls = foundControls.filter((c, index) => {
          return foundControls.indexOf(c) === index;
        });
      }

      // Filter by overlay
      if (filter.omit_overlayed_controls) {
        controls = controls.filter(
          (control) => control.extended_by.length === 0
        );
      }

      // Filter by search term
      if (filter.search_term !== undefined) {
        const term = filter.search_term.toLowerCase();

        // Filter controls to those that contain search term
        controls = controls.filter((c) => contains_term(c, term));
      }

      // Filter by nist stuff
      if (filter.tree_filters && filter.tree_filters.length > 0) {
        // Construct a nist control to represent the filter
        const control = new nist.NistControl(filter.tree_filters);

        controls = controls.filter((c) => {
          // Get an hdf version so we have the fixed nist tags
          return c.root.hdf.parsed_nist_tags.some((t) => control.contains(t));
        });
      }

      // Freeze and save to cache
      const r = Object.freeze(controls);
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

  const newFilter: Filter = {
    search_term: new_search,
    omit_overlayed_controls: f.omit_overlayed_controls || false,
    ...f
  };
  return JSON.stringify(newFilter);
}
