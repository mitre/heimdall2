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
import {
  ChecklistAsset,
  ChecklistFile,
  ChecklistVuln
} from '@mitre/hdf-converters';
import {
  ContextualizedControl,
  ContextualizedProfile,
  ControlStatus,
  NistControl,
  Severity
} from 'inspecjs';
import * as _ from 'lodash';
import LRUCache from 'lru-cache';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {SearchEntry, SearchModule} from './search';

const MAX_CACHE_ENTRIES = 20;

export declare type ExtendedControlStatus = ControlStatus | 'Waived';

export type FilterRecord = boolean | SearchEntry[] | undefined;

/** Contains common filters on data from the store. */
export interface Filter {
  // General
  /** Which file these objects came from. Undefined => any */
  fromFile: FileID[];

  // Control specific
  /** What status the controls can have. Undefined => any */
  status?: SearchEntry[]; //ExtendedControlStatus[];

  /** What severity the controls can have. Undefined => any */
  severity?: SearchEntry[]; //Severity[];

  /** Whether or not to allow/include overlayed controls */
  omit_overlayed_controls?: boolean;

  /** Control IDs to search for */
  ids?: SearchEntry[];

  /** Titles to search for */
  titleSearchTerms?: SearchEntry[];

  /** Descriptions to search for */
  descriptionSearchTerms?: SearchEntry[];

  /** Code to search for */
  codeSearchTerms?: SearchEntry[];

  /** CCIs to search for */
  nistIdFilter?: SearchEntry[];

  /** Ruleid to search for */
  ruleidSearchTerms?: SearchEntry[];

  /** Vulid to search for */
  vulidSearchTerms?: SearchEntry[];

  /** Stigid to search for */
  stigidSearchTerms?: SearchEntry[];

  /** Classification to search for */
  classificationSearchTerms?: SearchEntry[];

  /** Groupname to search for */
  groupNameSearchTerms?: SearchEntry[];

  /** Checklist CCIs to search for */
  cciSearchTerms?: SearchEntry[];

  /** Checklist keywords to search for */
  keywordsSearchTerms?: SearchEntry[];

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
  selectedChecklistIds: FileID[] = [];

  /** For Checklist Viewer */
  readonly emptyRule: ChecklistVuln = {
    status: '',
    findingDetails: '',
    comments: '',
    severityOverride: '',
    severityJustification: '',
    vulnNum: '',
    severity: '',
    groupTitle: '',
    ruleId: '',
    ruleVersion: '',
    ruleTitle: '',
    vulnDiscuss: '',
    iaControls: '',
    checkContent: '',
    fixText: '',
    falsePositives: '',
    falseNegatives: '',
    documentable: '',
    mitigations: '',
    potentialImpact: '',
    thirdPartyTools: '',
    mitigationControl: '',
    responsibility: '',
    securityOverrideGuidance: '',
    checkContentRef: '',
    weight: '',
    class: '',
    stigRef: '',
    targetKey: '',
    stigUuid: '',
    legacyId: '',
    cciRef: ''
  };

  readonly emptyAsset: ChecklistAsset = {
    role: '',
    assettype: '',
    hostname: '',
    hostip: '',
    hostmac: '',
    hostfqdn: '',
    marking: '',
    targetcomment: '',
    techarea: '',
    targetkey: '',
    webordatabase: false,
    webdbsite: '',
    webdbinstance: ''
  };

  selectedRule: ChecklistVuln = this.emptyRule;

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
  SELECT_CHECKLIST(file: FileID): void {
    this.selectedChecklistIds = [file];
  }

  @Mutation
  SELECT_RULE(rule: ChecklistVuln): void {
    this.selectedRule = rule;
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
  CLEAR_CHECKLIST(removeId: FileID): void {
    this.selectedChecklistIds = this.selectedChecklistIds.filter(
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
  CLEAR_ALL_CHECKLISTS(): void {
    this.selectedChecklistIds = [];
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
  public select_exclusive_evaluation(fileID: FileID): void {
    this.CLEAR_ALL_EVALUATIONS();
    this.SELECT_EVALUATIONS([fileID]);
  }

  @Action
  public select_exclusive_profile(fileID: FileID): void {
    this.CLEAR_ALL_PROFILES();
    this.SELECT_PROFILES([fileID]);
  }

  @Action
  public selectRule(rule: ChecklistVuln): void {
    this.SELECT_RULE(rule);
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
  public toggle_checklist(fileID: FileID): void {
    if (this.selectedChecklistIds.includes(fileID)) {
      this.CLEAR_CHECKLIST(fileID);
      this.SELECT_RULE(this.emptyRule);
    } else {
      this.SELECT_CHECKLIST(fileID);
    }
  }

  @Action
  public clear_file(fileID: FileID): void {
    this.CLEAR_EVALUATION(fileID);
    this.CLEAR_PROFILE(fileID);
    this.CLEAR_CHECKLIST(fileID);
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

  get checklists(): (file: FileID) => ChecklistFile[] {
    return (file: FileID) => {
      return InspecDataModule.allChecklistFiles.filter(
        (e) => e.uniqueId === file
      );
    };
  }

  get selected_file_ids(): FileID[] {
    return [
      ...this.selectedEvaluationIds,
      ...this.selectedProfileIds,
      ...this.selectedChecklistIds
    ];
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

  get checklist_selected(): Trinary {
    if (this.selectedChecklistIds.length === 1) return Trinary.On;
    else return Trinary.Off;
  }

  /**
   * Parameterized getter.
   * Get all controls from all profiles from the specified file id.
   * Utlizes the profiles getter to accelerate the file filter.
   *
   * @param filter - Filters to apply
   * @returns Controls from all profiles from the specified file id
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

      const controlFilters: Record<string, FilterRecord> = {
        'root.hdf.severity': filter.severity,
        'hdf.wraps.id': filter.ids,
        'hdf.wraps.title': filter.titleSearchTerms,
        'hdf.wraps.desc': filter.descriptionSearchTerms,
        'hdf.rawNistTags': filter.nistIdFilter,
        full_code: filter.codeSearchTerms,
        'hdf.waived': filter.status?.includes({
          value: 'Waived',
          negated: false
        }),
        'root.hdf.status': _.filter(
          filter.status,
          (status) => status.value !== 'Waived'
        )
      };

      controls = filterControlsBy(controls, controlFilters);

      // Filter by overlay
      if (filter.omit_overlayed_controls) {
        controls = controls.filter(
          (control) => control.extendedBy.length === 0
        );
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

  // Default Status Toggles
  passedFilterEnabled = false;
  failedFilterEnabled = false;
  naFilterEnabled = false;
  nrFilterEnabled = false;

  /** List of status switches */
  controlStatusSwitches: {
    name: string;
    value: ExtendedControlStatus;
    enabled: boolean;
    color: string;
  }[] = [
    {
      name: 'Passed',
      value: 'Passed',
      enabled: this.passedFilterEnabled,
      color: 'statusPassed'
    },
    {
      name: 'Failed',
      value: 'Failed',
      enabled: this.failedFilterEnabled,
      color: 'statusFailed'
    },
    {
      name: 'Not Applicable',
      value: 'Not Applicable',
      enabled: this.naFilterEnabled,
      color: 'statusNotApplicable'
    },
    {
      name: 'Not Reviewed',
      value: 'Not Reviewed',
      enabled: this.nrFilterEnabled,
      color: 'statusNotReviewed'
    }
  ];

  @Mutation
  alterStatusBoolean() {
    this.controlStatusSwitches.forEach((item, itemIndex) => {
      if (
        SearchModule.statusFilter.some(
          (statusFilter) =>
            statusFilter.value.toLowerCase() === item.value.toLowerCase()
        )
      ) {
        this.controlStatusSwitches[itemIndex].enabled = true;
      } else {
        this.controlStatusSwitches[itemIndex].enabled = false;
      }
    });
  }

  /**
   * Handles the condition change when a status switch is clicked
   *
   * @param name - Status value of clicked switch
   *
   */
  @Action
  changeStatusSwitch(name: ExtendedControlStatus) {
    //  Commented code is for testing the removal of all values no matter case sensitivity //
    const regex = new RegExp(name, 'i');
    const temp = SearchModule.currentSearchResult.clone();
    this.controlStatusSwitches.forEach((item, itemIndex) => {
      if (item.name == name.charAt(0).toUpperCase() + name.slice(1)) {
        this.controlStatusSwitches[itemIndex].enabled =
          !this.controlStatusSwitches[itemIndex].enabled;
        if (!this.controlStatusSwitches[itemIndex].enabled) {
          SearchModule.addSearchFilter({
            field: 'status',
            value: name.toLowerCase(),
            negated: false // Defaulted as false
          });
        } else {
          SearchModule.removeSearchFilter({
            field: 'status',
            value: item.value.toLowerCase(),
            negated: false // Defaulted as false
          });

          temp.conditionArray.forEach(
            (item: {keyword: string; value: string; negated: boolean}) => {
              if (
                item.keyword === 'status' &&
                regex.exec(item.value) !== null
              ) {
                temp.removeEntry('status', item.value, false);
              }
            }
          );
          SearchModule.SET_SEARCH(temp.toString());
        }
      }
    });
  }

  // Default Severity Toggles
  criticalFilterEnabled = false;
  highFilterEnabled = false;
  mediumFilterEnabled = false;
  lowFilterEnabled = false;

  /** List of severity switches */
  severitySwitches: {
    name: string;
    value: Severity;
    enabled: boolean;
    color: string;
  }[] = [
    {
      name: 'Critical',
      value: 'critical',
      enabled: this.criticalFilterEnabled,
      color: 'teal'
    },
    {
      name: 'High',
      value: 'high',
      enabled: this.highFilterEnabled,
      color: 'teal'
    },
    {
      name: 'Medium',
      value: 'medium',
      enabled: this.mediumFilterEnabled,
      color: 'teal'
    },
    {
      name: 'Low',
      value: 'low',
      enabled: this.lowFilterEnabled,
      color: 'teal'
    }
  ];

  severitySwitchToggles: {[key: string]: boolean} = {
    Critical: this.criticalFilterEnabled,
    High: this.highFilterEnabled,
    Medium: this.mediumFilterEnabled,
    Low: this.lowFilterEnabled
  };

  @Mutation
  alterSeverityBoolean() {
    this.severitySwitches.forEach((item, itemIndex) => {
      if (
        SearchModule.severityFilter.some(
          (severityFilter) =>
            severityFilter.value.toLowerCase() === item.value.toLowerCase()
        )
      ) {
        this.severitySwitches[itemIndex].enabled = true;
      } else {
        this.severitySwitches[itemIndex].enabled = false;
      }
    });
  }

  /**
   * Handles the condition change when a severity switch is clicked
   *
   * @param name - Severity value of clicked switch
   *
   */
  @Action
  changeSeveritySwitch(name: Severity) {
    const regex = new RegExp(name, 'i');
    const temp = SearchModule.currentSearchResult.clone();
    this.severitySwitches.forEach((item, itemIndex) => {
      if (item.name == name.charAt(0).toUpperCase() + name.slice(1)) {
        this.severitySwitches[itemIndex].enabled =
          !this.severitySwitches[itemIndex].enabled;
        if (!this.severitySwitches[itemIndex].enabled) {
          SearchModule.addSearchFilter({
            field: 'severity',
            value: name.toLowerCase(),
            negated: false // Defaulted as false
          });
        } else {
          SearchModule.removeSearchFilter({
            field: 'severity',
            value: item.value.toLowerCase(),
            negated: false // Defaulted as false
          });

          temp.conditionArray.forEach(
            (item: {keyword: string; value: string; negated: boolean}) => {
              if (
                item.keyword === 'severity' &&
                regex.exec(item.value) !== null
              ) {
                temp.removeEntry('severity', item.value, false);
              }
            }
          );
          SearchModule.SET_SEARCH(temp.toString());
        }
      }
    });
  }
}

export const FilteredDataModule = getModule(FilteredData);

/**
 * Generates a unique string to represent a filter.
 * Does some minor "acceleration" techniques such as
 * - annihilating empty search terms
 * - defaulting "omit_overlayed_controls"
 *
 * @param f - Filter object
 * @returns Converted newFilter to a JSON string.
 *
 */
export function filter_cache_key(f: Filter) {
  const newFilter: Filter = {
    searchTerm: f.searchTerm?.trim() || '',
    omit_overlayed_controls: f.omit_overlayed_controls || false,
    ...f
  };
  return JSON.stringify(newFilter);
}

/**
 * Filters controls by given filters
 *
 * @param controls - Array of contextualized controls
 * @param filters - Filters to apply to the controls
 * @returns Filtered array of controls
 *
 */
export function filterControlsBy(
  controls: readonly ContextualizedControl[],
  filters: Record<string, FilterRecord>
): readonly ContextualizedControl[] {
  const activeFilters: typeof filters = _.pickBy(
    filters,
    (value, _key) =>
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'boolean' && value)
  );

  // Filter out specific categories
  const firstPass = controls.filter((control) => {
    return Object.entries(activeFilters).every(([filter, value]) => {
      const item: SearchEntry | SearchEntry[] | boolean = _.get(
        control,
        filter
      );
      if (Array.isArray(value) && typeof item !== 'boolean') {
        return value?.some((term) => {
          if (!term.negated) {
            return fieldIncludes(item, (compareValue) =>
              compareValue.toLowerCase().includes(term.value.toLowerCase())
            );
          } else {
            return !fieldIncludes(item, (compareValue) =>
              compareValue.toLowerCase().includes(term.value.toLowerCase())
            );
          }
        });
      } else {
        return item === value;
      }
    });
  });

  // Overall keywords filtering
  const final: ContextualizedControl[] = filterControlsByKeywords(firstPass);

  return final;
}

/**
 * Filters controls by keyword filters
 *
 * @param controls - Array of contextualized controls
 * @returns Filtered array of controls
 *
 */
export function filterControlsByKeywords(controls: ContextualizedControl[]) {
  let results = controls;
  if (SearchModule.keywordsSearchTerms.length > 0) {
    SearchModule.keywordsSearchTerms.forEach((filter) => {
      if (!filter.negated) {
        results = controls.filter((control) => {
          return contains_term(control, filter.value);
        });
      } else {
        results = controls.filter((control) => {
          return !contains_term(control, filter.value);
        });
      }
    });
  }
  return results;
}

/**
 * Filters checklist rules by given filters
 *
 * @param rules - Array of checklist rules
 * @param filters - Filters to apply to the checklist rules
 * @returns Filtered checklist rules
 *
 */
export function filterChecklistBy(
  rules: readonly ChecklistVuln[],
  filters: Record<string, FilterRecord>
): readonly ChecklistVuln[] {
  const activeFilters: typeof filters = _.pickBy(
    filters,
    (value, _key) =>
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'boolean' && value)
  );

  // Filter out specific categories
  const firstPass = rules.filter((rule) => {
    return Object.entries(activeFilters).every(([filter, value]) => {
      const item: SearchEntry | SearchEntry[] | boolean = _.get(rule, filter);
      if (Array.isArray(value) && typeof item !== 'boolean') {
        return value?.some((term) => {
          if (!term.negated) {
            return fieldIncludes(item, (compareValue) =>
              compareValue.toLowerCase().includes(term.value.toLowerCase())
            );
          } else {
            return !fieldIncludes(item, (compareValue) =>
              compareValue.toLowerCase().includes(term.value.toLowerCase())
            );
          }
        });
      } else {
        return item === value;
      }
    });
  });

  // Overall keywords filtering
  const final: ChecklistVuln[] = filterRulesByKeywords(firstPass);

  return final;
}

/**
 * Filters checklist rules by keyword filters
 *
 * @param controls - Array of checklist rules
 * @returns Filtered array of checklist rules
 *
 */
export function filterRulesByKeywords(rules: ChecklistVuln[]) {
  let result = rules;
  if (SearchModule.keywordsSearchTerms.length > 0) {
    SearchModule.keywordsSearchTerms.forEach((filter) => {
      if (!filter.negated) {
        result = rules.filter((rule) => {
          return rule_contains_term(rule, filter);
        });
      } else {
        result = rules.filter((rule) => {
          return !rule_contains_term(rule, filter);
        });
      }
    });
  }

  return result;
}

/**
 * Searches rule to see if term exists
 *
 * @param rule - Checklist rule to check
 * @param filter - Filter object to search for
 * @returns If term exists true, else false
 *
 */
function rule_contains_term(rule: ChecklistVuln, filter: SearchEntry): boolean {
  // See if any contain filter term
  return Object.entries(rule).some((item) => {
    if (item[1]?.toLowerCase().includes(filter.value)) {
      return true;
    } else {
      return false;
    }
  });
}

/**
 * Get checklist rules that should be displayed.
 *
 * @param rules - Array of checklist rules
 * @param filters - Any filters that should be applied
 * @returns Array of checklist rules after processing
 *
 */
export function checklistRules(
  rules: readonly ChecklistVuln[],
  filters: Filter
): readonly ChecklistVuln[] {
  // If an attribute name changes in the checklist mapping, make sure it is reflected here
  const checklistFilters: Record<string, FilterRecord> = {
    severity: filters.severity,
    vulnNum: filters.vulidSearchTerms,
    ruleId: filters.ruleidSearchTerms,
    ruleVersion: filters.stigidSearchTerms,
    class: filters.classificationSearchTerms,
    groupTitle: filters.groupNameSearchTerms,
    cciRef: filters.cciSearchTerms,
    status: _.filter(
      filters.status,
      (status: SearchEntry) => status.value !== 'Waived'
    )
  };
  const filteredRules = filterChecklistBy(rules, checklistFilters);
  return filteredRules;
}

/**
 * Checks provided entry and calls the string compare function provided on every element
 *
 * @param entry - Value of the entry
 * @param comparator - Function used to compare
 * @returns A boolean value returned from the comparator function passed
 *
 */
function fieldIncludes(
  entry: SearchEntry | SearchEntry[],
  comparator: (compareValue: string) => boolean
) {
  if (typeof entry === 'string') {
    return comparator(entry);
  } else {
    return false;
  }
}
