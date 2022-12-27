import Store from '@/store/store';
import {Severity} from 'inspecjs';
//@ts-ignore
import {parse} from 'search-string';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {ExtendedControlStatus, FilteredDataModule} from './data_filters';

export interface ISearchState {
  searchTerm: string;
  freeSearch: string;
  titleSearchTerms: SearchEntry[];
  descriptionSearchTerms: SearchEntry[];
  controlIdSearchTerms: SearchEntry[];
  codeSearchTerms: SearchEntry[];
  ruleidSearchTerms: SearchEntry[];
  vulidSearchTerms: SearchEntry[];
  stigidSearchTerms: SearchEntry[];
  classificationSearchTerms: SearchEntry[];
  groupNameSearchTerms: SearchEntry[];
  cciSearchTerms: SearchEntry[];
  NISTIdFilter: SearchEntry[];
  statusFilter: SearchEntry[];
  severityFilter: SearchEntry[];
  keywordsSearchTerms: SearchEntry[];
}

/** (Unknown)  */
export interface SearchQuery {
  [key: string]: {
    include?: string;
    exclude?: string;
  };
}

/** Type used to represent a parsed value and negated pair from query string  */
export type SearchEntry = {
  value: string | ExtendedControlStatus | Severity;
  negated: boolean;
};

/** List of possible status types  */
export const statusTypes = [
  'Not Applicable',
  'From Profile',
  'Profile Error',
  'Passed',
  'Failed',
  'Not Reviewed',
  'Waived'
];

/** List of possible severity types  */
export const severityTypes = ['none', 'low', 'medium', 'high', 'critical'];

/**
 * Will lowercase a string or array of strings.
 *
 * @param input - The string or array of strings that need to be lowercased
 */
export function lowercaseAll(input: string | string[]): string | string[] {
  if (typeof input === 'string') {
    return input.toLowerCase();
  } else {
    return input.map((string) => {
      return string.toLowerCase();
    });
  }
}

/**
 * Will take a string and map it to a severity.
 *
 * @param severity - The string to be mapped to a severity
 * @returns The severity string as a Severity
 */
export function valueToSeverity(severity: string): Severity {
  if (severityTypes.includes(severity.toLowerCase())) {
    return severity as Severity;
  } else {
    return 'none';
  }
}
@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'SearchModule'
})
class Search extends VuexModule implements ISearchState {
  controlIdSearchTerms: SearchEntry[] = [];
  codeSearchTerms: SearchEntry[] = [];
  ruleidSearchTerms: SearchEntry[] = [];
  vulidSearchTerms: SearchEntry[] = [];
  stigidSearchTerms: SearchEntry[] = [];
  classificationSearchTerms: SearchEntry[] = [];
  groupNameSearchTerms: SearchEntry[] = [];
  cciSearchTerms: SearchEntry[] = [];
  NISTIdFilter: SearchEntry[] = [];
  descriptionSearchTerms: SearchEntry[] = [];
  freeSearch = '';
  searchTerm = '';
  statusFilter: SearchEntry[] = [];
  severityFilter: SearchEntry[] = [];
  titleSearchTerms: SearchEntry[] = [];
  keywordsSearchTerms: SearchEntry[] = [];

  /** Update the current search */
  @Action
  updateSearch(newValue: string) {
    if (newValue) {
      this.context.commit('SET_SEARCH', newValue);
    } else {
      this.context.commit('SET_SEARCH', '');
    }
  }

  /** Current value of the parsed query string */
  currentSearchResult: any = parse('');

  /** Parse search bar to add strings to needed filter category */
  @Mutation
  setCurrentSearchResult(value: any) {
    this.currentSearchResult = value;
  }

  /** Parse search bar to add strings to needed filter category */
  @Action
  parseSearch() {
    this.clear();
    const gatherFreeText = true;
    const freeTextTransformer = (text: string) =>
      gatherFreeText && {
        key: 'keywords',
        value: text
      };
    const searchResult = parse(this.searchTerm, [freeTextTransformer]);
    this.setCurrentSearchResult(searchResult);
    searchResult.conditionArray.forEach(
      (prop: {keyword: string; value: string; negated: boolean}): void => {
        const include: {value: string; negated: boolean} = {
          value: prop.value,
          negated: prop.negated
        };
        if (include.value === '') {
          return;
        }

        switch (prop.keyword) {
          case 'status':
            this.addStatusFilter({
              value: include.value,
              negated: include.negated
            });
            break;
          case 'severity':
            this.addSeverityFilter({
              value: include.value,
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
          case 'keywords':
            this.addKeywordsFilter({
              value: include.value,
              negated: include.negated
            });
            break;
        }
      }
    );

    FilteredDataModule.alterStatusBoolean();
    FilteredDataModule.alterSeverityBoolean();
  }

  /** Sets the current search */
  @Mutation
  SET_SEARCH(newSearch: string) {
    this.searchTerm = newSearch;
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
    this.context.commit('CLEAR_KEYWORDS');
  }

  /** Mapper for category input fields to valid filter values*/
  categoryToFilterMapping: Map<string, string> = new Map([
    ['Vul ID', 'vulid'],
    ['Rule ID', 'ruleid'],
    ['Stig ID', 'stigid'],
    ['Classification', 'classification'],
    ['Group Name', 'groupname'],
    ['CCIs', 'cii'],
    ['Keywords', 'keywords']
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
    if (this.currentSearchResult == undefined) {
      return;
    }
    // If coming from a category filter, else a quick filter
    if (!this.categoryToFilterMapping.get(searchPayload.field)) {
      this.currentSearchResult.addEntry(
        searchPayload.field,
        searchPayload.value,
        searchPayload.negated
      );
    } else {
      this.currentSearchResult.addEntry(
        this.categoryToFilterMapping.get(searchPayload.field),
        searchPayload.value,
        searchPayload.negated
      );
    }
    this.context.commit('SET_SEARCH', this.currentSearchResult.toString());
  }

  /**
   * Allows values to be removed from a specific field in the querystring.
   * @param searchPayload - An object of field (The field to add to (e.g., status, severity, etc.)), value (The value to add to the field (e.g., "Passed","Failed", etc.)), and previousValues (The values already in the querystring)
   */
  @Action
  removeSearchFilter(searchPayload: {
    field: string;
    value: string;
    negated: boolean;
  }) {
    if (this.currentSearchResult == undefined) {
      return;
    }

    this.currentSearchResult.removeEntry(
      searchPayload.field,
      searchPayload.value,
      searchPayload.negated
    );
    this.context.commit('SET_SEARCH', this.currentSearchResult.toString());
  }

  // Status filtering

  @Action
  addStatusFilter(status: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_STATUS', status);
  }

  @Action
  removeStatusFilter(status: SearchEntry) {
    this.context.commit('REMOVE_STATUS', status);
  }

  @Action
  setStatusFilter(status: SearchEntry[]) {
    this.context.commit('SET_STATUS', status);
  }

  /** Adds a status filter */
  @Mutation
  ADD_STATUS(status: SearchEntry | SearchEntry[]) {
    this.statusFilter = this.statusFilter.concat(status);
  }

  /** Removes a status filter */
  @Mutation
  REMOVE_STATUS(status: SearchEntry) {
    this.statusFilter = this.statusFilter.filter(
      (filter) => filter.value.toLowerCase() !== status.value.toLowerCase()
    );
  }

  @Mutation
  CLEAR_STATUS() {
    this.statusFilter = [];
  }

  @Mutation
  SET_STATUS(status: SearchEntry[]) {
    this.statusFilter = status;
  }

  // Severity filtering

  /** Adds severity to filter */
  @Action
  addSeverityFilter(severity: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_SEVERITY', severity);
  }

  @Action
  removeSeverity(severity: SearchEntry) {
    this.context.commit('REMOVE_SEVERITY', severity);
  }

  @Action
  setSeverity(severity: SearchEntry[]) {
    this.context.commit('SET_SEVERITY', severity);
  }

  @Action
  clearSeverityFilter() {
    this.context.commit('CLEAR_SEVERITY');
  }

  @Mutation
  ADD_SEVERITY(severity: SearchEntry | SearchEntry[]) {
    this.severityFilter = this.severityFilter.concat(severity);
  }

  @Mutation
  REMOVE_SEVERITY(severity: SearchEntry) {
    this.severityFilter = this.severityFilter.filter(
      (filter) => filter.value.toLowerCase() !== severity.value.toLowerCase()
    );
  }

  /** Sets the severity filter */
  @Mutation
  SET_SEVERITY(severity: SearchEntry[]) {
    this.severityFilter = severity;
  }

  /** Clears all severity filters */
  @Mutation
  CLEAR_SEVERITY() {
    this.severityFilter = [];
  }

  // Control ID Filtering

  /** Adds control id to filter */
  @Action
  addIdFilter(id: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_ID', id);
  }

  @Mutation
  ADD_ID(id: SearchEntry | SearchEntry[]) {
    this.controlIdSearchTerms = this.controlIdSearchTerms.concat(id);
  }

  /** Sets the control IDs filter */
  @Mutation
  SET_ID(ids: SearchEntry[]) {
    this.controlIdSearchTerms = ids;
  }

  /** Clears all control ID filters */
  @Mutation
  CLEAR_ID() {
    this.controlIdSearchTerms = [];
  }

  // Title filtering

  /** Adds a title filter */
  @Action
  addTitleFilter(title: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_TITLE', title);
  }

  @Mutation
  ADD_TITLE(title: SearchEntry | SearchEntry[]) {
    this.titleSearchTerms = this.titleSearchTerms.concat(title);
  }

  /** Sets the title filters */
  @Mutation
  SET_TITLE(titles: SearchEntry[]) {
    this.titleSearchTerms = titles;
  }

  /** Clears all title filters */
  @Mutation
  CLEAR_TITLE() {
    this.titleSearchTerms = [];
  }

  // NIST ID Filtering

  /** Adds NIST ID to filter */
  @Action
  addNISTIdFilter(NISTId: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_NIST', NISTId);
  }

  @Mutation
  ADD_NIST(NISTId: SearchEntry | SearchEntry[]) {
    this.NISTIdFilter = this.NISTIdFilter.concat(NISTId);
  }

  /** Clears all NIST ID filters */
  @Mutation
  CLEAR_NIST() {
    this.NISTIdFilter = [];
  }

  // Description Filtering

  /** Calls the description mutator to add a description to the filter */
  @Action
  addDescriptionFilter(description: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_DESCRIPTION', description);
  }

  /** Adds a description to the filter */
  @Mutation
  ADD_DESCRIPTION(description: SearchEntry | SearchEntry[]) {
    this.descriptionSearchTerms =
      this.descriptionSearchTerms.concat(description);
  }

  /** Clears all description from the filters */
  @Mutation
  CLEAR_DESCRIPTION() {
    this.descriptionSearchTerms = [];
  }

  // Code filtering

  /** Adds code to filter */
  @Action
  addCodeFilter(code: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_CODE', code);
  }

  @Mutation
  ADD_CODE(code: SearchEntry | SearchEntry[]) {
    this.codeSearchTerms = this.codeSearchTerms.concat(code);
  }

  /** Clears all code filters */
  @Mutation
  CLEAR_CODE() {
    this.codeSearchTerms = [];
  }

  // Ruleid filtering

  /** Adds Ruleid to filter */
  @Action
  addRuleidFilter(ruleid: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_RULEID', ruleid);
  }

  @Mutation
  ADD_RULEID(ruleid: SearchEntry | SearchEntry[]) {
    this.ruleidSearchTerms = this.ruleidSearchTerms.concat(ruleid);
  }

  /** Clears all Ruleid filters */
  @Mutation
  CLEAR_RULEID() {
    this.ruleidSearchTerms = [];
  }

  // Vulid filtering

  /** Adds Vulid to filter */
  @Action
  addVulidFilter(vulid: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_VULID', vulid);
  }

  @Mutation
  ADD_VULID(vulid: SearchEntry | SearchEntry[]) {
    this.vulidSearchTerms = this.vulidSearchTerms.concat(vulid);
  }

  /** Clears all Vulid filters */
  @Mutation
  CLEAR_VULID() {
    this.vulidSearchTerms = [];
  }

  // Stigid filtering

  /** Adds Stigid to filter */
  @Action
  addStigidFilter(stigid: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_STIGID', stigid);
  }

  @Mutation
  ADD_STIGID(stigid: SearchEntry | SearchEntry[]) {
    this.stigidSearchTerms = this.stigidSearchTerms.concat(stigid);
  }

  /** Clears all Stigid filters */
  @Mutation
  CLEAR_STIGID() {
    this.stigidSearchTerms = [];
  }

  // Classification filtering

  /** Adds Classification to filter */
  @Action
  addClassificationFilter(classification: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_CLASSIFICATION', classification);
  }

  @Mutation
  ADD_CLASSIFICATION(classification: SearchEntry | SearchEntry[]) {
    this.classificationSearchTerms =
      this.classificationSearchTerms.concat(classification);
  }

  /** Clears all Classification filters */
  @Mutation
  CLEAR_CLASSIFICATION() {
    this.classificationSearchTerms = [];
  }

  // Groupname filtering

  /** Adds Groupname to filter */
  @Action
  addGroupnameFilter(groupname: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_GROUPNAME', groupname);
  }

  @Mutation
  ADD_GROUPNAME(groupname: SearchEntry | SearchEntry[]) {
    this.groupNameSearchTerms = this.groupNameSearchTerms.concat(groupname);
  }

  /** Clears all Groupname filters */
  @Mutation
  CLEAR_GROUPNAME() {
    this.groupNameSearchTerms = [];
  }

  // CCI filtering

  /** Adds CCI to filter */
  @Action
  addCciFilter(cci: SearchEntry | SearchEntry[]) {
    this.context.commit('ADD_CCI', cci);
  }

  @Mutation
  ADD_CCI(cci: SearchEntry | SearchEntry[]) {
    this.cciSearchTerms = this.cciSearchTerms.concat(cci);
  }

  /** Clears all CCI filters */
  @Mutation
  CLEAR_CCI() {
    this.cciSearchTerms = [];
  }

  /** Adds Keywords to filter */
  @Action
  addKeywordsFilter(keyword: SearchEntry) {
    this.context.commit('ADD_KEYWORD', keyword);
  }

  @Mutation
  ADD_KEYWORD(keyword: SearchEntry) {
    this.keywordsSearchTerms = this.keywordsSearchTerms.concat(keyword);
  }

  /** Clears all keyword filters */
  @Mutation
  CLEAR_KEYWORDS() {
    this.keywordsSearchTerms = [];
  }
}

export const SearchModule = getModule(Search);
