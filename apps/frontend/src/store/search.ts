import Store from '@/store/store';
import {Severity} from 'inspecjs';
import {parse} from 'search-query-parser';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {ExtendedControlStatus, lowercaseAll} from './data_filters';

export interface ISearchState {
  searchTerm: string;
  freeSearch: string;
  titleSearchTerms: string[];
  descriptionSearchTerms: string[];
  controlIdSearchTerms: string[];
  codeSearchTerms: string[];
  cciIdFilter: string[];
  statusFilter: ExtendedControlStatus[];
  severityFilter: Severity[];
}

export interface SearchQuery {
  [key: string]: {
    include?: string;
    exclude?: string;
  };
}

export const statusTypes = [
  'Not Applicable',
  'From Profile',
  'Profile Error',
  'Passed',
  'Failed',
  'Not Reviewed',
  'Waived'
];

export const severityTypes = ['none', 'low', 'medium', 'high', 'critical'];

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'SearchModule'
})
class Search extends VuexModule implements ISearchState {
  controlIdSearchTerms: string[] = [];
  codeSearchTerms: string[] = [];
  cciIdFilter: string[] = [];
  descriptionSearchTerms: string[] = [];
  freeSearch = '';
  searchTerm = '';
  statusFilter: ExtendedControlStatus[] = [];
  severityFilter: Severity[] = [];
  titleSearchTerms: string[] = [];

  /** Update the current search */
  @Action
  updateSearch(newValue: string) {
    this.context.commit('SET_SEARCH', newValue);
  }

  @Action
  parseSearch() {
    this.clear();
    const options = {
      keywords: [
        'status',
        'severity',
        'impact',
        'id',
        'title',
        'nist',
        'desc',
        'description',
        'code',
        'input'
      ]
    };
    const searchResult = parse(this.searchTerm, options);
    if (typeof searchResult === 'string') {
      this.setFreesearch(searchResult);
    } else {
      for (const prop in searchResult) {
        const include: string | string[] = searchResult[prop] || '';
        switch (prop) {
          case 'status':
            this.addStatusFilter(
              include as ExtendedControlStatus | ExtendedControlStatus[]
            );
            break;
          case 'severity':
            this.addSeverity(lowercaseAll(include) as Severity | Severity[]);
            break;
          case 'id':
            this.addIdFilter(lowercaseAll(include));
            break;
          case 'title':
            this.addTitleFilter(lowercaseAll(include));
            break;
          case 'nist':
            this.addCCIIdFilter(lowercaseAll(include));
            break;
          case 'desc':
          case 'description':
            this.addDescriptionFilter(lowercaseAll(include));
          case 'code':
            this.addCodeFilter(lowercaseAll(include));
          case 'text':
            if (typeof include === 'string') {
              this.setFreesearch(include);
            }
        }
      }
    }
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
    this.context.commit('CLEAR_CCI');
    this.context.commit('CLEAR_DESCRIPTION');
    this.context.commit('CLEAR_CODE');
    this.context.commit('CLEAR_FREESEARCH');
  }

  // Status filtering

  @Action
  addStatusSearch(status: ExtendedControlStatus) {
    if (this.searchTerm.trim() !== '') {
      this.context.commit(
        'SET_SEARCH',
        `${this.searchTerm} AND status:${status}`
      );
    } else {
      this.context.commit('SET_SEARCH', `status:${status}`);
    }
  }

  @Action
  addStatusFilter(status: ExtendedControlStatus | ExtendedControlStatus[]) {
    this.context.commit('ADD_STATUS', status);
  }

  @Action
  setStatusFilter(status: ExtendedControlStatus[]) {
    this.context.commit('SET_STATUS', status);
  }

  /** Adds a status filter */
  @Mutation
  ADD_STATUS(status: ExtendedControlStatus | ExtendedControlStatus[]) {
    this.statusFilter = this.statusFilter.concat(status);
  }

  @Mutation
  CLEAR_STATUS() {
    this.statusFilter = [];
  }

  @Mutation
  SET_STATUS(status: ExtendedControlStatus[]) {
    this.statusFilter = status;
  }

  // Severity filtering

  /** Adds or replaces severity search in the search bar */
  @Action
  addSeveritySearch(severity: Severity) {
    if (this.searchTerm.trim() !== '') {
      this.context.commit(
        'SET_SEARCH',
        `${this.searchTerm} AND severity:${severity}`
      );
    } else {
      this.context.commit('SET_SEARCH', `severity:${severity}`);
    }
  }

  /** Adds severity to filter */
  @Action
  addSeverity(severity: Severity | Severity[]) {
    this.context.commit('ADD_SEVERITY', severity);
  }

  @Action
  setSeverity(severity: Severity[]) {
    this.context.commit('SET_SEVERITY', severity);
  }

  @Mutation
  ADD_SEVERITY(severity: Severity | Severity[]) {
    this.severityFilter = this.severityFilter.concat(severity);
  }

  /** Sets the severity filter */
  @Mutation
  SET_SEVERITY(severity: Severity[]) {
    this.severityFilter = severity;
  }

  /** Clears all severity filters */
  @Mutation
  CLEAR_SEVERITY() {
    this.severityFilter = [];
  }

  // Control ID Filtering

  /** Adds or replaces ID search in the search bar */
  @Action
  addIdSearch(id: string) {
    if (this.searchTerm.trim() !== '') {
      this.context.commit('SET_SEARCH', `${this.searchTerm} AND id:${id}`);
    } else {
      this.context.commit('SET_SEARCH', `id:${id}`);
    }
  }

  /** Adds control id to filter */
  @Action
  addIdFilter(id: string | string[]) {
    this.context.commit('ADD_ID', id);
  }

  @Mutation
  ADD_ID(id: string | string[]) {
    this.controlIdSearchTerms = this.controlIdSearchTerms.concat(id);
  }

  /** Sets the control IDs filter */
  @Mutation
  SET_ID(ids: string[]) {
    this.controlIdSearchTerms = ids;
  }

  /** Clears all control ID filters */
  @Mutation
  CLEAR_ID() {
    this.controlIdSearchTerms = [];
  }

  // Title filtering

  /** Adds or replaces title in the search bar */
  @Action
  addTitleSearch(title: string) {
    if (this.searchTerm.trim() !== '') {
      this.context.commit(
        'SET_SEARCH',
        `${this.searchTerm} AND title:${title}`
      );
    } else {
      this.context.commit('SET_SEARCH', `title:${title}`);
    }
  }

  /** Adds a title filter */
  @Action
  addTitleFilter(title: string | string[]) {
    this.context.commit('ADD_TITLE', title);
  }

  @Mutation
  ADD_TITLE(title: string | string[]) {
    this.titleSearchTerms = this.titleSearchTerms.concat(title);
  }

  /** Sets the title filters */
  @Mutation
  SET_TITLE(titles: string[]) {
    this.titleSearchTerms = titles;
  }

  /** Clears all title filters */
  @Mutation
  CLEAR_TITLE() {
    this.titleSearchTerms = [];
  }

  // CCI ID Filtering

  /** Adds or replaces severity in the search bar */
  @Action
  addCCIIdSearch(cciId: string) {
    if (this.searchTerm.trim() !== '') {
      this.context.commit('SET_SEARCH', `${this.searchTerm} AND nist:${cciId}`);
    } else {
      this.context.commit('SET_SEARCH', `nist:${cciId}`);
    }
  }

  /** Adds CCI id to filter */
  @Action
  addCCIIdFilter(cciId: string | string[]) {
    this.context.commit('ADD_CCI', cciId);
  }

  @Mutation
  ADD_CCI(cciId: string | string[]) {
    this.cciIdFilter = this.cciIdFilter.concat(cciId);
  }

  /** Sets the CCI IDs filter */
  @Mutation
  SET_CCI(cciIds: string[]) {
    this.cciIdFilter = cciIds;
  }

  /** Clears all CCI ID filters */
  @Mutation
  CLEAR_CCI() {
    this.cciIdFilter = [];
  }

  // Description Filtering

  /** Adds or replaces description filter in the search bar */
  @Action
  addDescriptionSearch(description: string) {
    if (this.searchTerm.trim() !== '') {
      this.context.commit(
        'SET_SEARCH',
        `${this.searchTerm} AND description:${description}`
      );
    } else {
      this.context.commit('SET_SEARCH', `description:${description}`);
    }
  }

  /** Adds description to filter */
  @Action
  addDescriptionFilter(description: string | string[]) {
    this.context.commit('ADD_DESCRIPTION', description);
  }

  /** Adds a description filter */
  @Mutation
  ADD_DESCRIPTION(description: string | string[]) {
    this.descriptionSearchTerms =
      this.descriptionSearchTerms.concat(description);
  }

  /** Sets the descriptions filter */
  @Mutation
  SET_DESCRIPTION(descriptions: string[]) {
    this.descriptionSearchTerms = descriptions;
  }

  /** Clears all description filters */
  @Mutation
  CLEAR_DESCRIPTION() {
    this.descriptionSearchTerms = [];
  }

  // Code filtering

  /** Adds or replaces code filter in the search bar */
  @Action
  addCodeSearch(code: string) {
    if (this.searchTerm.trim() !== '') {
      this.context.commit('SET_SEARCH', `${this.searchTerm} AND code:${code}`);
    } else {
      this.context.commit('SET_SEARCH', `code:${code}`);
    }
  }

  /** Adds code to filter */
  @Action
  addCodeFilter(code: string | string[]) {
    this.context.commit('ADD_CODE', code);
  }

  @Mutation
  ADD_CODE(code: string | string[]) {
    this.codeSearchTerms = this.codeSearchTerms.concat(code);
  }

  /** Sets the code filter */
  @Mutation
  SET_CODE(code: string[]) {
    this.codeSearchTerms = code;
  }

  /** Clears all code filters */
  @Mutation
  CLEAR_CODE() {
    this.codeSearchTerms = [];
  }

  // Freetext search

  /** Sets the current fulltext search */
  @Action
  setFreesearch(search: string) {
    this.context.commit('SET_FREESEARCH', search);
  }

  @Mutation
  SET_FREESEARCH(text: string) {
    this.freeSearch = text;
  }

  /** Removes the current fulltext search */
  @Mutation
  CLEAR_FREESEARCH() {
    this.freeSearch = '';
  }
}

export const SearchModule = getModule(Search);
