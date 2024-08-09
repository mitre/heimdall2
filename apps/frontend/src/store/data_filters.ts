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
import {execution_unique_key} from '@/utilities/format_util';
import {
  componentFitsSeverityFilter,
  getSbomComponents,
  isOnlySbomFileId,
  isSbomFileId,
  SBOMComponent
} from '@/utilities/sbom_util';
import {
  ContextualizedControl,
  ContextualizedProfile,
  ControlStatus,
  NistControl,
  Severity
} from 'inspecjs';
import * as _ from 'lodash';
import {LRUCache} from 'lru-cache';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

const MAX_CACHE_ENTRIES = 20;

export declare type ExtendedControlStatus = ControlStatus | 'Waived';

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

  /** Code to search for */
  codeSearchTerms?: string[];

  /** Tags to search for */
  tagFilter?: string[];

  /** CCIs to search for */
  nistIdFilter?: string[];

  /** A search term string, case insensitive
   * We look for this in
   * - control ID
   * - rule title
   * - severity
   * - status
   * - finding details (from HDF)
   * - code
   */
  searchTerm?: string;

  /** The current state of the Nist Treemap. Used to further filter by nist categories etc. */
  treeFilters?: TreeMapState;

  /** A specific control id */
  control_id?: string;
}

export type TreeMapState = string[]; // Representing the current path spec, from root

/**
 * Checks certain attributes from the given control to see if they include the given search term
 * @param term The string to search with
 * @param contextControl The control to search for term in
 */
function contains_term(
  contextControl: ContextualizedControl,
  term: string
): boolean {
  const asHDF = contextControl.root.hdf;
  // Get our searchable data (some attributes are optional so may be null or undefined)
  const searchables: string[] = [
    asHDF.wraps.id,
    asHDF.wraps.title,
    asHDF.wraps.code,
    asHDF.severity,
    asHDF.status,
    asHDF.finding_details
  ].filter(_.isString);

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

  /**
   * Contains only SBOMs that have no results
   * Some SBOMs will be contained in `selectedEvaulationIds`
   * because they contian results
   */
  private selectedSbomIds: FileID[] = [];

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
  SELECT_SBOMS(files: FileID[]): void {
    this.selectedSbomIds = [...new Set([...files, ...this.selectedSbomIds])];
  }

  /**
   * Removes the given fileId from the selected evaluations
   * or selected sboms lists because a file id could be in either one
   * or both of the arrays
   * @param removeId
   */
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
  CLEAR_SBOM(removeId: FileID): void {
    this.selectedSbomIds = this.selectedSbomIds.filter(
      (ids) => ids !== removeId
    );
    // removes the selection from the selectedEvaluation if it is not in `selectedSbomIds`
    this.selectedEvaluationIds = this.selectedEvaluationIds.filter(
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

  @Mutation
  CLEAR_ALL_SBOMS(): void {
    // remove all SBOM ids from selectedEvaluationIds
    this.selectedEvaluationIds = this.selectedEvaluationIds.filter(
      (id) => !isSbomFileId(id)
    );
    this.selectedSbomIds = [];
  }

  @Action
  public toggle_all_evaluations(): void {
    if (this.all_evaluations_selected === Trinary.On) {
      this.CLEAR_ALL_EVALUATIONS();
    } else {
      this.SELECT_EVALUATIONS(
        InspecDataModule.allEvaluationFiles.map((v) => v.uniqueId)
      );
    }
  }

  @Action
  public toggle_all_profiles(): void {
    if (this.all_profiles_selected === Trinary.On) {
      this.CLEAR_ALL_PROFILES();
    } else {
      this.SELECT_PROFILES(
        InspecDataModule.allProfileFiles.map((v) => v.uniqueId)
      );
    }
  }

  @Action
  public toggle_all_sboms(): void {
    if (this.all_sboms_selected === Trinary.On) {
      this.CLEAR_ALL_SBOMS();
    } else {
      const allSbomFiles = InspecDataModule.allSbomFiles.map((v) => v.uniqueId);
      this.SELECT_SBOMS(allSbomFiles.filter(isOnlySbomFileId));
      this.SELECT_EVALUATIONS(allSbomFiles.filter((f) => !isOnlySbomFileId(f)));
    }
  }

  /**
   * Leaves only one file selected between evaluations and SBOMs
   * @param fileID The only file that will remain selected
   */
  @Action
  public select_exclusive_evaluation(fileID: FileID): void {
    this.CLEAR_ALL_EVALUATIONS();
    this.CLEAR_ALL_SBOMS();
    if (isOnlySbomFileId(fileID)) {
      this.SELECT_SBOMS([fileID]);
    } else {
      this.SELECT_EVALUATIONS([fileID]);
    }
  }

  @Action
  public select_exclusive_profile(fileID: FileID): void {
    this.CLEAR_ALL_PROFILES();
    this.SELECT_PROFILES([fileID]);
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
  public toggle_sbom(fileID: FileID): void {
    if (this.selected_sbom_ids.includes(fileID)) {
      this.CLEAR_SBOM(fileID);
    } else {
      this.SELECT_SBOMS([fileID]);
    }
  }

  @Action
  public clear_file(fileID: FileID): void {
    this.CLEAR_EVALUATION(fileID);
    this.CLEAR_PROFILE(fileID);
    this.CLEAR_SBOM(fileID);
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
        files.includes(e.from_file.uniqueId)
      );
    };
  }

  get profiles_for_evaluations(): (
    files: FileID[]
  ) => readonly ContextualizedProfile[] {
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
        return files.includes(e.from_file.uniqueId);
      });
    };
  }

  /**
   * Parameterized getter.
   * Gets all evaluations from the specified file ids that contain
   * SBOM component data in the passthrough
   */
  get sboms(): (files: FileID[]) => readonly SourcedContextualizedEvaluation[] {
    return (files: FileID[]) => {
      return InspecDataModule.contextualSboms.filter((e) => {
        return files.includes(e.from_file.uniqueId);
      });
    };
  }

  get selected_file_ids(): FileID[] {
    return [
      ...this.selectedEvaluationIds,
      ...this.selectedProfileIds,
      ...this.selectedSbomIds
    ];
  }

  get selected_evaluation_ids(): FileID[] {
    return this.selectedEvaluationIds;
  }

  get selected_profile_ids(): FileID[] {
    return this.selectedProfileIds;
  }

  get selected_sbom_ids(): FileID[] {
    return this.selectedSbomIds.concat(
      this.selectedEvaluationIds.filter(isSbomFileId)
    );
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

  // check to see if any profile is selected
  get any_profile_selected(): boolean {
    return this.selectedProfileIds.length > 0;
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

  // check to see if any evaluation is selected
  get any_evaluation_selected(): boolean {
    return this.selectedEvaluationIds.length > 0;
  }

  // check to see if all evaluations are selected
  get all_sboms_selected(): Trinary {
    switch (this.selected_sbom_ids.length) {
      case 0:
        return Trinary.Off;
      case InspecDataModule.allSbomFiles.length:
        return Trinary.On;
      default:
        return Trinary.Mixed;
    }
  }

  // check to see if any sbom is selected
  get any_sbom_selected(): boolean {
    return this.selected_sbom_ids.length > 0;
  }

  /**
   * Parameterized getter.
   * Get all controls from all profiles from the specified file id.
   * Utilizes the profiles getter to accelerate the file filter.
   */
  get controls(): (filter: Filter) => readonly ContextualizedControl[] {
    /** Cache by filter */
    const localCache: LRUCache<string, readonly ContextualizedControl[]> =
      new LRUCache({max: MAX_CACHE_ENTRIES});

    return (filter: Filter) => {
      // Generate a hash for cache purposes.
      // If the "searchTerm" string is not null, we don't cache - no need to pollute
      const id: string = filter_cache_key(filter);

      // Check if we have this cached:
      const cached = localCache.get(id);
      if (cached !== undefined) {
        return cached;
      }

      // Get profiles from loaded Results
      let profiles: readonly ContextualizedProfile[] =
        this.profiles_for_evaluations(filter.fromFile);

      // Get profiles from loaded Profiles
      profiles = profiles.concat(this.profiles(filter.fromFile));

      // And all the controls they contain
      let controls: readonly ContextualizedControl[] = profiles.flatMap(
        (profile) => profile.contains
      );

      // Filter by single control id
      if (filter.control_id !== undefined) {
        controls = controls.filter((c) => c.data.id === filter.control_id);
      }

      const controlFilters: Record<string, boolean | string[] | undefined> = {
        'root.hdf.severity': filter.severity,
        'hdf.wraps.id': filter.ids,
        'hdf.wraps.title': filter.titleSearchTerms,
        'hdf.wraps.desc': filter.descriptionSearchTerms,
        'hdf.rawNistTags': filter.nistIdFilter,
        full_code: filter.codeSearchTerms,
        'hdf.waived': filter.status?.includes('Waived'),
        'root.hdf.status': _.filter(
          filter.status,
          (status) => status !== 'Waived'
        )
      };
      controls = filterControlsBy(controls, controlFilters);

      // Filter by tags
      if (filter.tagFilter && filter.tagFilter.length > 0) {
        controls = controls.filter((control) => {
          if (filter.tagFilter) {
            // every tag in the filter must be contained in the control's tags
            const tags = Object.keys(control.data.tags).map((t) =>
              t.toLowerCase()
            );
            return filter.tagFilter.every((tag) => {
              return tags.includes(tag);
            });
          }
        });
      }

      // Filter by overlay
      if (filter.omit_overlayed_controls) {
        controls = controls.filter(
          (control) => control.extendedBy.length === 0
        );
      }

      // Freeform search
      if (filter.searchTerm !== undefined) {
        const term = filter.searchTerm.toLowerCase();

        // Filter controls to those that contain search term
        controls = controls.filter((c) => contains_term(c, term));
      }

      // Filter by nist stuff
      if (filter.treeFilters && filter.treeFilters.length > 0) {
        // Construct a nist control to represent the filter
        const control = new NistControl(filter.treeFilters);

        controls = controls.filter((c) => {
          // Get an hdf version so we have the fixed nist tags
          return c.root.hdf.parsedNistTags.some((t) => control.contains(t));
        });
      }

      // Freeze and save to cache
      const r = Object.freeze(controls);
      localCache.set(id, r);
      return r;
    };
  }

  get components(): (filter: Filter) => readonly SBOMComponent[] {
    return (filter: Filter) => {
      const evaluations = this.sboms(filter.fromFile);
      const components: SBOMComponent[] = [];
      const controls = this.controls(filter);

      // grab every component from each section and apply a filter if necessary
      for (const evaluation of evaluations) {
        for (const component of getSbomComponents(evaluation)) {
          const key = `${execution_unique_key(evaluation)}-${component['bom-ref']}`;
          // filter components by their affecting vulnerabilities
          if (
            !filter.severity ||
            componentFitsSeverityFilter(component, filter.severity, controls)
          )
            components.push({...component, _key: key});
        }
      }
      return components;
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
  const newFilter: Filter = {
    searchTerm: f.searchTerm?.trim() || '',
    omit_overlayed_controls: f.omit_overlayed_controls || false,
    ...f
  };
  return JSON.stringify(newFilter);
}

export function filterControlsBy(
  controls: readonly ContextualizedControl[],
  filters: Record<string, boolean | string[] | undefined>
): readonly ContextualizedControl[] {
  const activeFilters: typeof filters = _.pickBy(
    filters,
    (value, _key) =>
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'boolean' && value)
  );
  return controls.filter((control) => {
    return Object.entries(activeFilters).every(([filter, value]) => {
      const item: string | string[] | boolean = _.get(control, filter);
      if (Array.isArray(value) && typeof item !== 'boolean') {
        return value?.some((term) => {
          return arrayOrStringIncludes(item, (compareValue) =>
            compareValue.toLowerCase().includes(term.toLowerCase())
          );
        });
      } else {
        return item === value;
      }
    });
  });
}

/** Iterate over a string or array of strings and call the string compare function provided on every element **/
function arrayOrStringIncludes(
  arrayOrString: string | string[],
  comparator: (compareValue: string) => boolean
) {
  if (typeof arrayOrString === 'string') {
    return comparator(arrayOrString);
  } else {
    return arrayOrString.some((value) => comparator(value));
  }
}
