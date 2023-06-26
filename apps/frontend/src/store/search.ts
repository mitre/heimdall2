import Store from '@/store/store';
import {controlStatuses, Severity} from 'inspecjs';
import _ from 'lodash';
import {parse} from 'search-string';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {ExtendedControlStatus} from './data_filters';
import {
  CciSearchTerm,
  ClassificationSearchTerm,
  CodeSearchTerm,
  ControlIdSearchTerm,
  DescriptionSearchTerm,
  FilenameSearchTerm,
  GroupNameSearchTerm,
  IaControlsSearchTerm,
  KeywordsSearchTerm,
  NistIdFilter,
  RuleIdSearchTerm,
  SearchFilterSyncModule,
  StigIdSearchTerm,
  TitleSearchTerm,
  VulIdSearchTerm
} from './search_filter_sync';

/** Type used to represent a parsed value and negated pair from query string  */
export type SearchEntry<T> = {
  value: T; // ex: string, ExtendedControlStatus, Severity, etc.
  negated: boolean;
};

/** List of possible status types  */
export const statusTypes = [...controlStatuses, 'Waived'];

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'SearchModule'
})
class Search extends VuexModule {
  searchTerm = ''; // Value entered into the top search bar

  /** Current value of the parsed query string
   * Standard format for the condition array:
   * Example: [ { keyword: 'status', value: 'Passed', negated: false },
   * { keyword: 'status', value: 'Failed', negated: true },
   * { keyword: 'severity', value: 'low', negated: true } ]
   */
  parsedSearchResult = parse('');

  inFileSearchTerms: {
    controlId: SearchEntry<ControlIdSearchTerm>[];
    code: SearchEntry<CodeSearchTerm>[];
    ruleid: SearchEntry<RuleIdSearchTerm>[];
    vulid: SearchEntry<VulIdSearchTerm>[];
    stigid: SearchEntry<StigIdSearchTerm>[];
    classification: SearchEntry<ClassificationSearchTerm>[];
    groupName: SearchEntry<GroupNameSearchTerm>[];
    cci: SearchEntry<CciSearchTerm>[];
    iacontrols: SearchEntry<IaControlsSearchTerm>[];
    NISTIdFilter: SearchEntry<NistIdFilter>[];
    description: SearchEntry<DescriptionSearchTerm>[];
    statusFilter: SearchEntry<ExtendedControlStatus>[];
    severityFilter: SearchEntry<Severity>[];
    title: SearchEntry<TitleSearchTerm>[];
    keywords: SearchEntry<KeywordsSearchTerm>[];
  } = {
    controlId: [],
    code: [],
    ruleid: [],
    vulid: [],
    stigid: [],
    classification: [],
    groupName: [],
    cci: [],
    iacontrols: [],
    NISTIdFilter: [],
    description: [],
    statusFilter: [],
    severityFilter: [],
    title: [],
    keywords: []
  };

  fileMetadataSearchTerms: {
    filename: SearchEntry<FilenameSearchTerm>[];
  } = {
    filename: []
  };

  /** Sets the current search */
  @Mutation
  SET_SEARCH(newSearch: string) {
    this.searchTerm = newSearch;
  }

  /** Update the current search */
  @Action
  updateSearch(newSearch: string) {
    if (newSearch) {
      this.context.commit('SET_SEARCH', newSearch);
    } else {
      this.context.commit('SET_SEARCH', '');
    }
  }

  /** Mapper for category input fields to valid filter values*/
  categoryToFilterMapping: Map<string, string> = new Map([
    ['Keywords', 'keywords'],
    ['ID', 'id'],
    ['Vul ID', 'vulid'],
    ['Rule ID', 'ruleid'],
    ['Title', 'title'],
    ['Nist', 'nist'],
    ['Description', 'description'],
    ['Code', 'code'],
    ['Stig ID', 'stigid'],
    ['Classification', 'classification'],
    ['IA Control', 'iaControl'],
    ['Group Name', 'groupname'],
    ['CCIs', 'cci'],
    ['File Name', 'filename']
  ]);

  /**
   * Allows values to be added to a specific field in the querystring.
   * @param searchPayload - An object of (The field to add to (e.g., status, severity, etc.)), value (The value to add to the field (e.g., "Passed","Failed", etc.)), and previousValues (The values already in the querystring)
   *
   */
  @Action
  addSearchFilter(searchPayload: {
    field: string;
    value: string;
    negated: boolean;
  }) {
    if (this.parsedSearchResult == undefined) {
      return;
    }
    // If coming from a category filter, else a quick filter
    if (!this.categoryToFilterMapping.get(searchPayload.field)) {
      this.parsedSearchResult.addEntry(
        searchPayload.field,
        searchPayload.value,
        searchPayload.negated
      );
    } else {
      this.parsedSearchResult.addEntry(
        this.categoryToFilterMapping.get(searchPayload.field),
        searchPayload.value,
        searchPayload.negated
      );
    }
    this.updateSearch(this.parsedSearchResult.toString());
  }

  /**
   * Allows values to be removed from a specific field in the querystring.
   * @param searchPayload - An object of field (The field to add to (e.g., status, severity, etc.)), value (The value to add to the field (e.g., "Passed","Failed", etc.)), and previousValues (The values already in the querystring)
   */
  @Action
  removeSearchFilter<T>(searchPayload: {
    field: string;
    value: T;
    negated: boolean;
  }) {
    if (this.parsedSearchResult == undefined) {
      return;
    }

    const clonedConditionArray = this.parsedSearchResult
      .getConditionArray()
      .slice();
    for (const searchEntry of clonedConditionArray) {
      const payloadValue = _.isString(searchPayload.value)
        ? searchPayload.value.toLowerCase()
        : searchPayload.value;
      if (
        searchEntry.keyword === searchPayload.field &&
        searchEntry.value.toLowerCase() === payloadValue
      ) {
        this.parsedSearchResult.removeEntry(
          searchPayload.field,
          searchEntry.value,
          searchPayload.negated
        );
      }
    }
    this.updateSearch(this.parsedSearchResult.toString());
  }

  // Status filtering

  @Action
  addStatusFilter(
    status:
      | SearchEntry<ExtendedControlStatus>
      | SearchEntry<ExtendedControlStatus>[]
  ) {
    this.context.commit('ADD_STATUS', status);
  }

  @Action
  removeStatusFilter(status: SearchEntry<ExtendedControlStatus>) {
    this.context.commit('REMOVE_STATUS', status);
  }

  @Action
  setStatusFilter(status: SearchEntry<ExtendedControlStatus>[]) {
    this.context.commit('SET_STATUS', status);
  }

  /** Adds a status filter */
  @Mutation
  ADD_STATUS(
    status:
      | SearchEntry<ExtendedControlStatus>
      | SearchEntry<ExtendedControlStatus>[]
  ) {
    this.inFileSearchTerms.statusFilter =
      this.inFileSearchTerms.statusFilter.concat(status);
  }

  /** Removes a status filter */
  @Mutation
  REMOVE_STATUS(status: SearchEntry<ExtendedControlStatus>) {
    this.inFileSearchTerms.statusFilter =
      this.inFileSearchTerms.statusFilter.filter(
        (filter) => filter.value.toLowerCase() !== status.value.toLowerCase()
      );
  }

  @Mutation
  CLEAR_STATUS() {
    this.inFileSearchTerms.statusFilter = [];
  }

  @Mutation
  SET_STATUS(status: SearchEntry<ExtendedControlStatus>[]) {
    this.inFileSearchTerms.statusFilter = status;
  }

  // Severity filtering

  /** Adds severity to filter */
  @Action
  addSeverityFilter(severity: SearchEntry<Severity> | SearchEntry<Severity>[]) {
    this.context.commit('ADD_SEVERITY', severity);
  }

  @Action
  removeSeverity(severity: SearchEntry<Severity>) {
    this.context.commit('REMOVE_SEVERITY', severity);
  }

  @Action
  setSeverity(severity: SearchEntry<Severity>[]) {
    this.context.commit('SET_SEVERITY', severity);
  }

  @Action
  clearSeverityFilter() {
    this.context.commit('CLEAR_SEVERITY');
  }

  @Mutation
  ADD_SEVERITY(severity: SearchEntry<Severity> | SearchEntry<Severity>[]) {
    this.inFileSearchTerms.severityFilter =
      this.inFileSearchTerms.severityFilter.concat(severity);
  }

  @Mutation
  REMOVE_SEVERITY(severity: SearchEntry<Severity>) {
    this.inFileSearchTerms.severityFilter =
      this.inFileSearchTerms.severityFilter.filter(
        (filter) => filter.value.toLowerCase() !== severity.value.toLowerCase()
      );
  }

  /** Sets the severity filter */
  @Mutation
  SET_SEVERITY(severity: SearchEntry<Severity>[]) {
    this.inFileSearchTerms.severityFilter = severity;
  }

  /** Clears all severity filters */
  @Mutation
  CLEAR_SEVERITY() {
    this.inFileSearchTerms.severityFilter = [];
  }

  // Control ID Filtering

  /** Adds control id to filter */
  @Action
  addIdFilter(
    id: SearchEntry<ControlIdSearchTerm> | SearchEntry<ControlIdSearchTerm>[]
  ) {
    this.context.commit('ADD_ID', id);
  }

  @Mutation
  ADD_ID(
    id: SearchEntry<ControlIdSearchTerm> | SearchEntry<ControlIdSearchTerm>[]
  ) {
    this.inFileSearchTerms.controlId =
      this.inFileSearchTerms.controlId.concat(id);
  }

  /** Sets the control IDs filter */
  @Mutation
  SET_ID(ids: SearchEntry<ControlIdSearchTerm>[]) {
    this.inFileSearchTerms.controlId = ids;
  }

  /** Clears all control ID filters */
  @Mutation
  CLEAR_ID() {
    this.inFileSearchTerms.controlId = [];
  }

  // Title filtering

  /** Adds a title filter */
  @Action
  addTitleFilter(
    title: SearchEntry<TitleSearchTerm> | SearchEntry<TitleSearchTerm>[]
  ) {
    this.context.commit('ADD_TITLE', title);
  }

  @Mutation
  ADD_TITLE(
    title: SearchEntry<TitleSearchTerm> | SearchEntry<TitleSearchTerm>[]
  ) {
    this.inFileSearchTerms.title = this.inFileSearchTerms.title.concat(title);
  }

  /** Sets the title filters */
  @Mutation
  SET_TITLE(titles: SearchEntry<TitleSearchTerm>[]) {
    this.inFileSearchTerms.title = titles;
  }

  /** Clears all title filters */
  @Mutation
  CLEAR_TITLE() {
    this.inFileSearchTerms.title = [];
  }

  // NIST ID Filtering

  /** Adds NIST ID to filter */
  @Action
  addNISTIdFilter(
    NISTId: SearchEntry<NistIdFilter> | SearchEntry<NistIdFilter>[]
  ) {
    this.context.commit('ADD_NIST', NISTId);
  }

  @Mutation
  ADD_NIST(NISTId: SearchEntry<NistIdFilter> | SearchEntry<NistIdFilter>[]) {
    this.inFileSearchTerms.NISTIdFilter =
      this.inFileSearchTerms.NISTIdFilter.concat(NISTId);
  }

  /** Clears all NIST ID filters */
  @Mutation
  CLEAR_NIST() {
    this.inFileSearchTerms.NISTIdFilter = [];
  }

  // Description Filtering

  /** Calls the description mutator to add a description to the filter */
  @Action
  addDescriptionFilter(
    description:
      | SearchEntry<DescriptionSearchTerm>
      | SearchEntry<DescriptionSearchTerm>[]
  ) {
    this.context.commit('ADD_DESCRIPTION', description);
  }

  /** Adds a description to the filter */
  @Mutation
  ADD_DESCRIPTION(
    description:
      | SearchEntry<DescriptionSearchTerm>
      | SearchEntry<DescriptionSearchTerm>[]
  ) {
    this.inFileSearchTerms.description =
      this.inFileSearchTerms.description.concat(description);
  }

  /** Clears all description from the filters */
  @Mutation
  CLEAR_DESCRIPTION() {
    this.inFileSearchTerms.description = [];
  }

  // Code filtering

  /** Adds code to filter */
  @Action
  addCodeFilter(
    code: SearchEntry<CodeSearchTerm> | SearchEntry<CodeSearchTerm>[]
  ) {
    this.context.commit('ADD_CODE', code);
  }

  @Mutation
  ADD_CODE(code: SearchEntry<CodeSearchTerm> | SearchEntry<CodeSearchTerm>[]) {
    this.inFileSearchTerms.code = this.inFileSearchTerms.code.concat(code);
  }

  /** Clears all code filters */
  @Mutation
  CLEAR_CODE() {
    this.inFileSearchTerms.code = [];
  }

  // Ruleid filtering

  /** Adds Ruleid to filter */
  @Action
  addRuleidFilter(
    ruleid: SearchEntry<RuleIdSearchTerm> | SearchEntry<RuleIdSearchTerm>[]
  ) {
    this.context.commit('ADD_RULEID', ruleid);
  }

  @Mutation
  ADD_RULEID(
    ruleid: SearchEntry<RuleIdSearchTerm> | SearchEntry<RuleIdSearchTerm>[]
  ) {
    this.inFileSearchTerms.ruleid =
      this.inFileSearchTerms.ruleid.concat(ruleid);
  }

  /** Clears all Ruleid filters */
  @Mutation
  CLEAR_RULEID() {
    this.inFileSearchTerms.ruleid = [];
  }

  // Vulid filtering

  /** Adds Vulid to filter */
  @Action
  addVulidFilter(
    vulid: SearchEntry<VulIdSearchTerm> | SearchEntry<VulIdSearchTerm>[]
  ) {
    this.context.commit('ADD_VULID', vulid);
  }

  @Mutation
  ADD_VULID(
    vulid: SearchEntry<VulIdSearchTerm> | SearchEntry<VulIdSearchTerm>[]
  ) {
    this.inFileSearchTerms.vulid = this.inFileSearchTerms.vulid.concat(vulid);
  }

  /** Clears all Vulid filters */
  @Mutation
  CLEAR_VULID() {
    this.inFileSearchTerms.vulid = [];
  }

  // Stigid filtering

  /** Adds Stigid to filter */
  @Action
  addStigidFilter(
    stigid: SearchEntry<StigIdSearchTerm> | SearchEntry<StigIdSearchTerm>[]
  ) {
    this.context.commit('ADD_STIGID', stigid);
  }

  @Mutation
  ADD_STIGID(
    stigid: SearchEntry<StigIdSearchTerm> | SearchEntry<StigIdSearchTerm>[]
  ) {
    this.inFileSearchTerms.stigid =
      this.inFileSearchTerms.stigid.concat(stigid);
  }

  /** Clears all Stigid filters */
  @Mutation
  CLEAR_STIGID() {
    this.inFileSearchTerms.stigid = [];
  }

  // Classification filtering

  /** Adds Classification to filter */
  @Action
  addClassificationFilter(
    classification:
      | SearchEntry<ClassificationSearchTerm>
      | SearchEntry<ClassificationSearchTerm>[]
  ) {
    this.context.commit('ADD_CLASSIFICATION', classification);
  }

  @Mutation
  ADD_CLASSIFICATION(
    classification:
      | SearchEntry<ClassificationSearchTerm>
      | SearchEntry<ClassificationSearchTerm>[]
  ) {
    this.inFileSearchTerms.classification =
      this.inFileSearchTerms.classification.concat(classification);
  }

  /** Clears all Classification filters */
  @Mutation
  CLEAR_CLASSIFICATION() {
    this.inFileSearchTerms.classification = [];
  }

  // Groupname filtering

  /** Adds Groupname to filter */
  @Action
  addGroupnameFilter(
    groupname:
      | SearchEntry<GroupNameSearchTerm>
      | SearchEntry<GroupNameSearchTerm>[]
  ) {
    this.context.commit('ADD_GROUPNAME', groupname);
  }

  @Mutation
  ADD_GROUPNAME(
    groupname:
      | SearchEntry<GroupNameSearchTerm>
      | SearchEntry<GroupNameSearchTerm>[]
  ) {
    this.inFileSearchTerms.groupName =
      this.inFileSearchTerms.groupName.concat(groupname);
  }

  /** Clears all Groupname filters */
  @Mutation
  CLEAR_GROUPNAME() {
    this.inFileSearchTerms.groupName = [];
  }

  // CCI filtering

  /** Adds CCI to filter */
  @Action
  addCciFilter(cci: SearchEntry<CciSearchTerm> | SearchEntry<CciSearchTerm>[]) {
    this.context.commit('ADD_CCI', cci);
  }

  @Mutation
  ADD_CCI(cci: SearchEntry<CciSearchTerm> | SearchEntry<CciSearchTerm>[]) {
    this.inFileSearchTerms.cci = this.inFileSearchTerms.cci.concat(cci);
  }

  /** Clears all CCI filters */
  @Mutation
  CLEAR_CCI() {
    this.inFileSearchTerms.cci = [];
  }

  // IA Controls filtering

  /** Adds IA Controls to filter */
  @Action
  addIaControlsFilter(
    iaControl:
      | SearchEntry<IaControlsSearchTerm>
      | SearchEntry<IaControlsSearchTerm>[]
  ) {
    this.context.commit('ADD_IA_CONTROL', iaControl);
  }

  @Mutation
  ADD_IA_CONTROL(
    iaControl:
      | SearchEntry<IaControlsSearchTerm>
      | SearchEntry<IaControlsSearchTerm>[]
  ) {
    this.inFileSearchTerms.iacontrols =
      this.inFileSearchTerms.iacontrols.concat(iaControl);
  }

  /** Clears all CCI filters */
  @Mutation
  CLEAR_IA_CONTROLS() {
    this.inFileSearchTerms.iacontrols = [];
  }

  /** Adds Keywords to filter */
  @Action
  addKeywordsFilter(keyword: SearchEntry<KeywordsSearchTerm>) {
    this.context.commit('ADD_KEYWORD', keyword);
  }

  @Mutation
  ADD_KEYWORD(keyword: SearchEntry<KeywordsSearchTerm>) {
    this.inFileSearchTerms.keywords =
      this.inFileSearchTerms.keywords.concat(keyword);
  }

  /** Clears all keyword filters */
  @Mutation
  CLEAR_KEYWORDS() {
    this.inFileSearchTerms.keywords = [];
  }

  /** Adds filename to filter */
  @Action
  addFilenameFilter(filename: SearchEntry<FilenameSearchTerm>) {
    this.context.commit('ADD_FILENAME', filename);
  }

  @Mutation
  ADD_FILENAME(filename: SearchEntry<FilenameSearchTerm>) {
    this.fileMetadataSearchTerms.filename =
      this.fileMetadataSearchTerms.filename.concat(filename);
  }

  /** Clears all filename filters */
  @Mutation
  CLEAR_FILENAME() {
    this.fileMetadataSearchTerms.filename = [];
  }

  /** Clears all current filters */
  @Action
  clear() {
    this.context.commit('CLEAR_SEVERITY');
    this.context.commit('CLEAR_STATUS');
    this.context.commit('CLEAR_ID');
    this.context.commit('CLEAR_TITLE');
    this.context.commit('CLEAR_NIST');
    this.context.commit('CLEAR_DESCRIPTION');
    this.context.commit('CLEAR_CODE');
    this.context.commit('CLEAR_RULEID');
    this.context.commit('CLEAR_VULID');
    this.context.commit('CLEAR_STIGID');
    this.context.commit('CLEAR_CLASSIFICATION');
    this.context.commit('CLEAR_GROUPNAME');
    this.context.commit('CLEAR_RULEID');
    this.context.commit('CLEAR_CCI');
    this.context.commit('CLEAR_IA_CONTROLS');
    this.context.commit('CLEAR_FILENAME');
    this.context.commit('CLEAR_KEYWORDS');
  }

  /** Set the parsed search result */
  @Mutation
  setParsedSearchResult(parsedSearchResult: Record<string, unknown>) {
    this.parsedSearchResult = parsedSearchResult;
  }

  /** Parse search bar to add strings to needed filter category */
  @Action
  parseSearch() {
    this.clear();
    const freeTextTransformer = (text: string) => ({
      key: 'keywords',
      value: text
    });
    const parsedSearchResult = parse(this.searchTerm, [freeTextTransformer]);
    this.setParsedSearchResult(parsedSearchResult);
    for (const prop of parsedSearchResult.getConditionArray()) {
      const include = {
        value: prop.value,
        negated: prop.negated
      };
      if (include.value === '') {
        continue;
      }

      switch (prop.keyword) {
        case 'status':
          this.addStatusFilter({
            value: include.value as ExtendedControlStatus,
            negated: include.negated
          });
          break;
        case 'severity':
          this.addSeverityFilter({
            value: include.value as Severity,
            negated: include.negated
          });
          break;
        case 'id':
          this.addIdFilter({value: include.value, negated: include.negated});
          break;
        case 'title':
          this.addTitleFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'nist':
          this.addNISTIdFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'desc':
        case 'description':
          this.addDescriptionFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'code':
          this.addCodeFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'ruleid':
          this.addRuleidFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'vulid':
          this.addVulidFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'stigid':
          this.addStigidFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'class':
        case 'classification':
          this.addClassificationFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'groupname':
          this.addGroupnameFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'cci':
          this.addCciFilter({value: include.value, negated: include.negated});
          break;
        case 'iaControl':
          this.addIaControlsFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'filename':
          this.addFilenameFilter({
            value: include.value,
            negated: include.negated
          });
          break;
        case 'keywords':
          this.addKeywordsFilter({
            value: include.value,
            negated: include.negated
          });
          break;
      }
    }

    SearchFilterSyncModule.alterStatusBoolean();
    SearchFilterSyncModule.alterSeverityBoolean();
  }
}

export const SearchModule = getModule(Search);
