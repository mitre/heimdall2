import Store from '@/store/store';
import {Severity} from 'inspecjs';
import {parse} from 'search-parser';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {ExtendedControlStatus} from './data_filters';

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

export function capitalizeMultiple(string: string | undefined): string {
  if (typeof string !== 'string') {
    return '';
  }
  const words = string.split(' ');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  return words.join(' ');
}

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
    const searchResult: SearchQuery[] = parse(this.searchTerm)[0];
    searchResult.forEach((result) => {
      for (const prop in result) {
        const include = result[prop].include || '';
        if (prop === 'status') {
          this.addStatusFilter(
            capitalizeMultiple(include) as ExtendedControlStatus
          );
        } else if (prop === 'severity') {
          this.addSeverity(include as Severity);
        } else if (prop === 'id') {
          this.addIdFilter(include);
        } else if (prop === 'title') {
          this.addTitleFilter(include);
        } else if (prop === 'nist') {
          this.addCCIIdFilter(include);
        } else if (prop === 'desc' || prop === 'description') {
          this.addDescriptionFilter(include);
        } else if (prop === 'code') {
          this.addCodeFilter(include);
        } else if (prop === 'input') {
          this.addCodeFilter(`input('${include}')`);
        } else if (prop === 'freetext') {
          this.setFreesearch(include);
        } else {
          this.setFreesearch(`${prop}:${include}`);
        }
      }
    });
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
  addStatusFilter(status: ExtendedControlStatus) {
    if (statusTypes.includes(status) && !this.statusFilter.includes(status)) {
      this.context.commit('ADD_STATUS', status);
    }
  }

  @Action
  setStatusFilter(status: ExtendedControlStatus[]) {
    this.context.commit('SET_STATUS', status);
  }

  /** Adds a status filter */
  @Mutation
  ADD_STATUS(status: ExtendedControlStatus) {
    this.statusFilter.push(status);
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
  addSeverity(severity: Severity) {
    if (
      severityTypes.includes(severity) &&
      !this.severityFilter.includes(severity)
    ) {
      this.context.commit('ADD_SEVERITY', severity);
    }
  }

  @Action
  setSeverity(severity: Severity[]) {
    this.context.commit('SET_SEVERITY', severity);
  }

  /** Adds a severity filter */
  @Mutation
  ADD_SEVERITY(severity: Severity) {
    this.severityFilter.push(severity);
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
  addIdFilter(id: string) {
    if (!this.controlIdSearchTerms.includes(id)) {
      this.context.commit('ADD_ID', id);
    }
  }

  @Mutation
  ADD_ID(id: string) {
    this.controlIdSearchTerms.push(id);
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
  addTitleFilter(title: string) {
    if (!this.titleSearchTerms.includes(title)) {
      this.context.commit('ADD_TITLE', title);
    }
  }

  @Mutation
  ADD_TITLE(title: string) {
    this.titleSearchTerms.push(title);
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
  addCCIIdFilter(cciId: string) {
    if (!this.cciIdFilter.includes(cciId)) {
      this.context.commit('ADD_CCI', cciId);
    }
  }

  @Mutation
  ADD_CCI(cciId: string) {
    this.cciIdFilter.push(cciId);
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
  addDescriptionFilter(description: string) {
    if (!this.descriptionSearchTerms.includes(description)) {
      this.context.commit('ADD_DESCRIPTION', description);
    }
  }

  /** Adds a description filter */
  @Mutation
  ADD_DESCRIPTION(description: string) {
    this.descriptionSearchTerms.push(description);
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
  addCodeFilter(code: string) {
    if (!this.codeSearchTerms.includes(code)) {
      this.context.commit('ADD_CODE', code);
    }
  }

  @Mutation
  ADD_CODE(code: string) {
    this.codeSearchTerms.push(code);
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
