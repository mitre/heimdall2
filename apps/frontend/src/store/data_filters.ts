/**
 * This module provides a cached, reusable method for filtering data from data_store.
 */

import {Trinary} from '@/enums/Trinary';
import {severities, statuses} from '@/plugins/vuetify';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationModule} from '@/store/evaluations';
import {
  EvaluationFile,
  FileID,
  InspecFile,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import Store from '@/store/store';
import {
  Assettype,
  ChecklistAsset,
  ChecklistObject,
  Severity as ChecklistSeverity,
  ChecklistVuln,
  Role,
  StatusMapping,
  Techarea
} from '@mitre/hdf-converters';
import {
  ContextualizedControl,
  ContextualizedProfile,
  ControlStatus,
  LowercasedControlStatus,
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
import {SearchEntry} from './search';
import {
  CciSearchTerm,
  ClassificationSearchTerm,
  CodeSearchTerm,
  ControlIdSearchTerm,
  DescriptionSearchTerm,
  EvaluationTagSearchTerm,
  FilenameSearchTerm,
  GroupNameSearchTerm,
  IaControlsSearchTerm,
  KeywordsSearchTerm,
  NistIdFilter,
  RuleIdSearchTerm,
  StigIdSearchTerm,
  TitleSearchTerm,
  UserGroupSearchTerm,
  VulIdSearchTerm
} from './search_filter_sync';
import {ExtendedVuln} from '@/views/Checklist.vue';

const MAX_CACHE_ENTRIES = 20;

export declare type ExtendedControlStatus = ControlStatus | 'Waived';

export type GenericSearchEntryValue = string | ExtendedControlStatus | Severity;

export type FilterRecord =
  | boolean
  | SearchEntry<GenericSearchEntryValue>[]
  | undefined;

/** Contains common filters for controls. */
export interface ControlsFilter {
  /** Which file these objects came from. Undefined => any */
  fromFile: FileID[];

  // Control specific
  /** What status the controls can have. Undefined => any */
  status?: SearchEntry<ExtendedControlStatus>[];

  /** What severity the controls can have. Undefined => any */
  severity?: SearchEntry<Severity>[];

  /** Titles to search for */
  titleSearchTerms?: SearchEntry<TitleSearchTerm>[];

  /** Descriptions to search for */
  descriptionSearchTerms?: SearchEntry<DescriptionSearchTerm>[];

  /** Code to search for */
  codeSearchTerms?: SearchEntry<CodeSearchTerm>[];

  /** CCIs to search for */
  nistIdFilter?: SearchEntry<NistIdFilter>[];

  /** Checklist keywords to search for */
  keywordsSearchTerms?: SearchEntry<KeywordsSearchTerm>[];

  /** Whether or not to allow/include overlayed controls */
  omit_overlayed_controls?: boolean;

  /** A specific control id */
  control_id?: string;

  /** Filenames to search for  */
  filenameSearchTerms?: SearchEntry<FilenameSearchTerm>[];

  /** User groups to search for  */
  userGroupSearchTerms?: SearchEntry<UserGroupSearchTerm>[];

  /** Evaluation tags to search for  */
  evalTagSearchTerms?: SearchEntry<EvaluationTagSearchTerm>[];

  // End of "generic" filters

  /** The current state of the Nist Treemap. Used to further filter by nist categories etc. */
  treeFilters?: TreeMapState;

  /** Control IDs to search for */
  ids?: SearchEntry<ControlIdSearchTerm>[];

  /** Tags to search for */
  tagFilter?: string[];

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
}

/** Contains common filters for a checklist. */
export interface ChecklistFilter {
  /** Which file these objects came from. Undefined => any */
  fromFile: FileID;

  // Control specific
  /** What status the controls can have. Undefined => any */
  status?: SearchEntry<ExtendedControlStatus>[];

  /** What severity the controls can have. Undefined => any */
  severity?: SearchEntry<Severity>[];

  /** Titles to search for */
  titleSearchTerms?: SearchEntry<TitleSearchTerm>[];

  /** Descriptions to search for */
  descriptionSearchTerms?: SearchEntry<DescriptionSearchTerm>[];

  /** Code to search for */
  codeSearchTerms?: SearchEntry<CodeSearchTerm>[];

  /** CCIs to search for */
  nistIdFilter?: SearchEntry<NistIdFilter>[];

  /** Checklist keywords to search for */
  keywordsSearchTerms?: SearchEntry<KeywordsSearchTerm>[];

  /** Whether or not to allow/include overlayed controls */
  omit_overlayed_controls?: boolean;

  /** A specific control id */
  control_id?: string;

  // End of "generic" filters

  /** Ruleid to search for */
  ruleidSearchTerms?: SearchEntry<RuleIdSearchTerm>[];

  /** Vulid to search for */
  vulidSearchTerms?: SearchEntry<VulIdSearchTerm>[];

  /** Stigid to search for */
  stigidSearchTerms?: SearchEntry<StigIdSearchTerm>[];

  /** Classification to search for */
  classificationSearchTerms?: SearchEntry<ClassificationSearchTerm>[];

  /** Groupname to search for */
  groupNameSearchTerms?: SearchEntry<GroupNameSearchTerm>[];

  /** Checklist CCIs to search for */
  cciSearchTerms?: SearchEntry<CciSearchTerm>[];

  /** Checklist CCIs to search for */
  iaControlsSearchTerms?: SearchEntry<IaControlsSearchTerm>[];
}

export type TreeMapState = string[]; // Representing the current path spec, from root

/**
 * Checks certain attributes from the given control to see if they include the given search term
 * @param term The string to search with
 * @param contextControl The control to search for term in
 */
function controlContainsTerm(
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

/**
 * Searches rule to see if term exists
 *
 * @param rule - Checklist rule to check
 * @param filter - Filter object to search for
 * @returns If term exists true, else false
 *
 */
function ruleContainsTerm(
  rule: ChecklistVuln,
  filter: SearchEntry<GenericSearchEntryValue>
): boolean {
  // See if any contain filter term
  return Object.values(rule).some((value) => {
    if (_.isBoolean(value)) {
      return value;
    }
    return value?.toLowerCase().includes(filter.value);
  });
}

export interface FilesFilter {
  filenameSearchTerms?: SearchEntry<FilenameSearchTerm>[];
  userGroupSearchTerms?: SearchEntry<UserGroupSearchTerm>[];
  evalTagSearchTerms?: SearchEntry<EvaluationTagSearchTerm>[];
}

export function fileMatchesFilter(
  file: InspecFile,
  filter?: FilesFilter
): boolean {
  if (filter === undefined) return true;

  interface FileFilteringProperties {
    filename: string[];
    groups: string[];
    tags: string[];
  }

  // note we wrap the filename in an array so it can be filtered using the same functions used for tags and groups
  const fileProperties: FileFilteringProperties = {
    filename: [file.filename.toLowerCase()],
    groups: [],
    tags: []
  };

  // if an evaluation exists from the database, populate the group names and tag values
  const evaluation = EvaluationModule.evaluationForFile(file);
  if (evaluation) {
    fileProperties.groups = evaluation.groups.map((g: {name: string}) =>
      g.name.toLowerCase()
    );
    fileProperties.tags = evaluation.evaluationTags.map((t: {value: string}) =>
      t.value.toLowerCase()
    );
  }

  // return true if any filter term matches any of the property values
  function oneMatches(fileProperty: string[], filterTerms: string[]): boolean {
    return filterTerms.some((term) =>
      fileProperty.some((p) => p.includes(term.toLowerCase()))
    );
  }

  // just get the term values, either the negated or not negated
  function getTerms(terms: SearchEntry<string>[], negated: boolean) {
    return terms
      .filter((t) => (negated ? t.negated : !t.negated))
      .map((t) => t.value);
  }

  const termsPropPairs = [
    {terms: filter.filenameSearchTerms, prop: fileProperties.filename},
    {terms: filter.userGroupSearchTerms, prop: fileProperties.groups},
    {terms: filter.evalTagSearchTerms, prop: fileProperties.tags}
  ];

  for (const {terms, prop} of termsPropPairs) {
    if (terms) {
      const positive = getTerms(terms, false);
      const negative = getTerms(terms, true);

      if (positive.length > 0 && !oneMatches(prop, positive)) {
        return false;
      }

      if (negative.length > 0 && oneMatches(prop, negative)) {
        return false;
      }
    }
  }

  return true;
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
  selectedChecklistId: FileID = '';

  /** Filter state for the checklist view */
  checklistFilterState: string = '';

  /** Sets the current checklist state */
  @Mutation
  SET_CHECKLIST_FILTER_STATE(checklistState: string) {
    this.checklistFilterState = checklistState;
  }

  /** Update the current checklist state */
  @Action
  setChecklistFilterState(checklistState: string) {
    this.context.commit('SET_CHECKLIST_FILTER_STATE', checklistState);
  }

  /** Filter state for the results view */
  resultsFilterState: string = '';

  /** Sets the current results state */
  @Mutation
  SET_RESULTS_FILTER_STATE(resultsState: string) {
    this.resultsFilterState = resultsState;
  }

  /** Update the current results state */
  @Action
  setResultsFilterState(resultsState: string) {
    this.context.commit('SET_RESULTS_FILTER_STATE', resultsState);
  }

  /** Filter state for the profiles view */
  profilesFilterState: string = '';

  /** Sets the current results state */
  @Mutation
  SET_PROFILES_FILTER_STATE(profilesState: string) {
    this.profilesFilterState = profilesState;
  }

  /** Update the current results state */
  @Action
  setProfilesFilterState(profilesState: string) {
    this.context.commit('SET_PROFILES_FILTER_STATE', profilesState);
  }

  /** For Checklist Viewer */
  readonly emptyRule: ChecklistVuln = {
    status: StatusMapping.Not_Reviewed,
    findingdetails: '',
    comments: '',
    severityoverride: ChecklistSeverity.Empty,
    severityjustification: '',
    vulnNum: '',
    severity: ChecklistSeverity.Empty,
    groupTitle: '',
    ruleId: '',
    ruleVer: '',
    ruleTitle: '',
    vulnDiscuss: '',
    iaControls: '',
    checkContent: '',
    fixText: '',
    falsePositives: '',
    falseNegatives: '',
    documentable: 'false',
    mitigations: '',
    potentialImpact: '',
    thirdPartyTools: '',
    mitigationControl: '',
    responsibility: '',
    securityOverrideGuidance: '',
    checkContentRef: '',
    weight: '',
    class: 'Unclass',
    stigRef: '',
    targetKey: '',
    stigUuid: '',
    legacyId: '',
    cciRef: ''
  };

  readonly emptyAsset: ChecklistAsset = {
    role: Role.None,
    assettype: Assettype.DefaultValue,
    hostname: '',
    hostip: '',
    hostmac: '',
    hostfqdn: '',
    marking: '',
    targetcomment: '',
    techarea: Techarea.Empty,
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
    this.selectedChecklistId = file;
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
  CLEAR_CHECKLIST(): void {
    this.selectedChecklistId = '';
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
    this.selectedChecklistId = '';
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
  public select_exclusive_checklist(fileID: FileID): void {
    const checklist: ChecklistObject = _.get(
      InspecDataModule.allChecklistFiles.find((f) => f.uniqueId === fileID)
        ?.evaluation.data,
      'passthrough.checklist'
    ) as unknown as ChecklistObject;
    this.SELECT_CHECKLIST(fileID);
    this.selectRule(checklist.stigs[0].vulns[0] ?? this.emptyRule);
  }

  @Action
  public clear_file(fileID: FileID): void {
    this.CLEAR_EVALUATION(fileID);
    this.CLEAR_PROFILE(fileID);
    this.CLEAR_CHECKLIST();
  }

  /**
   * Parameterized getter.
   * Get all evaluations from the specified file ids
   */
  get evaluations(): (
    files: FileID[],
    filter?: FilesFilter
  ) => readonly SourcedContextualizedEvaluation[] {
    return (files: FileID[], filter?: FilesFilter) => {
      return InspecDataModule.contextualExecutions.filter(
        (e) =>
          files.includes(e.from_file.uniqueId) &&
          fileMatchesFilter(e.from_file, filter)
      );
    };
  }

  get profiles_for_evaluations(): (
    files: FileID[],
    filter?: FilesFilter
  ) => readonly ContextualizedProfile[] {
    return (files: FileID[], filter?: FilesFilter) => {
      // Filter to those that match our filter. In this case that just means come from the right file id
      return this.evaluations(files, filter).flatMap(
        (evaluation) => evaluation.contains
      );
    };
  }

  /**
   * Parameterized getter.
   * Get all profiles from the specified file ids.
   */
  get profiles(): (
    files: FileID[],
    filter?: FilesFilter
  ) => readonly SourcedContextualizedProfile[] {
    return (files: FileID[], filter?: FilesFilter) => {
      return InspecDataModule.contextualProfiles.filter(
        (e) =>
          files.includes(e.from_file.uniqueId) &&
          fileMatchesFilter(e.from_file, filter)
      );
    };
  }

  get checklists(): (file: FileID) => EvaluationFile[] {
    return (file: FileID) => {
      return InspecDataModule.allChecklistFiles.filter(
        (e) => e.uniqueId === file
      );
    };
  }

  get selected_file_ids(): FileID[] {
    return [...this.selectedEvaluationIds, ...this.selectedProfileIds];
  }

  get selected_checklist(): FileID {
    return this.selectedChecklistId;
  }

  get selected_evaluation_ids(): FileID[] {
    return this.selectedEvaluationIds;
  }

  get selected_profile_ids(): FileID[] {
    return this.selectedProfileIds;
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

  get checklist_selected(): Trinary {
    return this.selectedChecklistId ? Trinary.On : Trinary.Off;
  }

  // check to see if any evaluation is selected
  get any_evaluation_selected(): boolean {
    return this.selectedEvaluationIds.length > 0;
  }

  /**
   * Parameterized getter.
   * Get all controls from all profiles from the specified file id.
   * Utilizes the profiles getter to accelerate the file filter.
   *
   * @param filter - Filters to apply
   * @returns Controls from all profiles from the specified file id
   */
  get controls(): (filter: ControlsFilter) => readonly ContextualizedControl[] {
    /** Cache by filter */
    const localCache: LRUCache<string, readonly ContextualizedControl[]> =
      new LRUCache({max: MAX_CACHE_ENTRIES});

    return (filter: ControlsFilter) => {
      // Generate a hash for cache purposes.
      // If the "searchTerm" string is not null, we don't cache - no need to pollute
      const id: string = filterCacheKey(filter);

      // Check if we have this cached:
      const cached = localCache.get(id);
      if (cached !== undefined) {
        return cached;
      }

      const filesFilter = {
        filenameSearchTerms: filter.filenameSearchTerms,
        userGroupSearchTerms: filter.userGroupSearchTerms,
        evalTagSearchTerms: filter.evalTagSearchTerms
      } as FilesFilter;

      // Get profiles from loaded Results
      let profiles: readonly ContextualizedProfile[] =
        this.profiles_for_evaluations(filter.fromFile, filesFilter);

      // Get profiles from loaded Profiles
      profiles = profiles.concat(this.profiles(filter.fromFile, filesFilter));

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
        ),
        keywords: filter.keywordsSearchTerms
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

  /** List of status switches */
  controlStatusSwitches: {
    name: string;
    value: LowercasedControlStatus;
    enabled: boolean;
    color: keyof typeof statuses;
  }[] = [
    {
      name: 'Passed',
      value: 'passed',
      enabled: false,
      color: 'statusPassed'
    },
    {
      name: 'Failed',
      value: 'failed',
      enabled: false,
      color: 'statusFailed'
    },
    {
      name: 'Not Applicable',
      value: 'not applicable',
      enabled: false,
      color: 'statusNotApplicable'
    },
    {
      name: 'Not Reviewed',
      value: 'not reviewed',
      enabled: false,
      color: 'statusNotReviewed'
    }
  ];

  /** List of severity switches */
  severitySwitches: {
    name: string;
    value: Severity;
    enabled: boolean;
    color: keyof typeof severities;
  }[] = [
    {
      name: 'Low',
      value: 'low',
      enabled: false,
      color: 'severityLow'
    },
    {
      name: 'Medium',
      value: 'medium',
      enabled: false,
      color: 'severityMedium'
    },
    {
      name: 'High',
      value: 'high',
      enabled: false,
      color: 'severityHigh'
    },
    {
      name: 'Critical',
      value: 'critical',
      enabled: false,
      color: 'severityCritical'
    }
  ];
}

export const FilteredDataModule = getModule(FilteredData);

/**
 * Get checklist rules that should be displayed.
 *
 * @param rules - Array of checklist rules
 * @param filters - Any filters that should be applied
 * @returns Array of checklist rules after processing
 *
 */
export function checklistRules(
  rules: readonly ExtendedVuln[],
  filters: ChecklistFilter
): readonly ExtendedVuln[] {
  // If an attribute name changes in the checklist mapping, make sure it is reflected here
  // TODO: edit the lhs of this Record's type to be keyof ChecklistVuln
  const checklistFilters: Partial<
    Record<keyof ExtendedVuln | 'keywords', FilterRecord>
  > = {
    severity: filters.severity,
    vulnNum: filters.vulidSearchTerms,
    ruleId: filters.ruleidSearchTerms,
    ruleVer: filters.stigidSearchTerms,
    class: filters.classificationSearchTerms,
    groupTitle: filters.groupNameSearchTerms,
    cciRef: filters.cciSearchTerms,
    iaControls: filters.iaControlsSearchTerms,
    status: _.filter(
      filters.status,
      (status: SearchEntry<ExtendedControlStatus>) => status.value !== 'Waived'
    ),
    keywords: filters.keywordsSearchTerms,
    nist: filters.nistIdFilter
  };
  const filteredRules = filterChecklistBy(rules, checklistFilters);
  return filteredRules;
}

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
export function filterCacheKey(f: ControlsFilter) {
  const newFilter: ControlsFilter = {
    searchTerm: f.searchTerm?.trim() || '',
    omit_overlayed_controls: f.omit_overlayed_controls || false,
    ...f
  };
  return JSON.stringify(newFilter);
}

/**
 * Filters controls by keyword filters
 *
 * @param controls - Array of contextualized controls
 * @returns Filtered array of controls
 *
 */
export function filterControlsByKeywords(
  controls: ContextualizedControl[],
  keywords: FilterRecord
) {
  let results = controls;
  if (keywords && Array.isArray(keywords)) {
    for (const filter of keywords) {
      results = !filter.negated
        ? controls.filter((control) => {
            return controlContainsTerm(control, filter.value);
          })
        : controls.filter((control) => {
            return !controlContainsTerm(control, filter.value);
          });
    }
  }
  return results;
}

/**
 * Filters checklist rules by keyword filters
 *
 * @param controls - Array of checklist rules
 * @returns Filtered array of checklist rules
 *
 */
export function filterRulesByKeywords(
  rules: ExtendedVuln[],
  keywords: FilterRecord
) {
  let result = rules;
  if (keywords && Array.isArray(keywords)) {
    for (const filter of keywords) {
      result = !filter.negated
        ? result.filter((rule) => ruleContainsTerm(rule, filter))
        : result.filter((rule) => !ruleContainsTerm(rule, filter));
    }
  }
  return result;
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
  const activeFilters: Record<string, FilterRecord> = _.pickBy(
    filters,
    (value) =>
      (Array.isArray(value) && value.length > 0) ||
      (_.isBoolean(value) && value)
  );

  // Filter out specific categories
  const firstPass = controls.filter((control) => {
    return Object.entries(activeFilters).every(([path, filter]) => {
      // Skip keywords for now
      if (path === 'keywords') {
        return true;
      }
      const item: unknown = _.get(control, path);
      if (Array.isArray(filter) && !_.isBoolean(item)) {
        return filter.some((term) => {
          const isIncluded = fieldIncludes(item, (compareValue) =>
            compareValue.toLowerCase().includes(term.value.toLowerCase())
          );
          return !term.negated ? isIncluded : !isIncluded;
        });
      } else {
        return item === filter;
      }
    });
  });

  // Overall keywords filtering
  const final: ContextualizedControl[] = filterControlsByKeywords(
    firstPass,
    activeFilters.keywords
  );
  return final;
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
  rules: readonly ExtendedVuln[],
  filters: Record<string, FilterRecord>
): readonly ExtendedVuln[] {
  const activeFilters: Record<string, FilterRecord> = _.pickBy(
    filters,
    (value) =>
      (Array.isArray(value) && value.length > 0) ||
      (_.isBoolean(value) && value)
  );

  // Filter out specific categories
  const firstPass = rules.filter((rule) => {
    return Object.entries(activeFilters).every(([path, filter]) => {
      // Skip keywords for now
      if (path === 'keywords') {
        return true;
      }
      const item: unknown = _.get(rule, path);
      if (Array.isArray(filter) && !_.isBoolean(item)) {
        return filter.some((term) => {
          const isIncluded = fieldIncludes(item, (compareValue) =>
            compareValue.toLowerCase().includes(term.value.toLowerCase())
          );
          return !term.negated ? isIncluded : !isIncluded;
        });
      } else {
        return item === filter;
      }
    });
  });

  // Overall keywords filtering
  const final: ExtendedVuln[] = filterRulesByKeywords(
    firstPass,
    filters.keywords
  );

  return final;
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
  entry: unknown,
  comparator: (compareValue: string) => boolean
) {
  if (typeof entry === 'string') {
    return comparator(entry);
  } else if (_.isBoolean(entry)) {
    return entry;
  } else if (Array.isArray(entry)) {
    return entry.some((value) => comparator(value));
  } else {
    return false;
  }
}
