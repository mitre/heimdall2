import type { Severity } from 'inspecjs';
import { severities } from 'inspecjs';
import { parse } from 'search-query-parser';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule,
} from 'vuex-module-decorators';
import Store from '@/store/store';
import type { ExtendedControlStatus } from './data_filters';

export type ISearchState = {
  codeSearchTerms: string[];
  controlIdSearchTerms: string[];
  descriptionSearchTerms: string[];
  freeSearch: string;
  NISTIdFilter: string[];
  searchTerm: string;
  severityFilter: Severity[];
  statusFilter: ExtendedControlStatus[];
  titleSearchTerms: string[];
};

export type SearchQuery = Record<string, {
  exclude?: string;
  include?: string;
}>;

export const statusTypes = [
  'Not Applicable',
  'From Profile',
  'Profile Error',
  'Passed',
  'Failed',
  'Not Reviewed',
  'Waived',
];

@Module({
  dynamic: true,
  name: 'SearchModule',
  namespaced: true,
  store: Store,
})
class Search extends VuexModule implements ISearchState {
  codeSearchTerms: string[] = [];
  controlIdSearchTerms: string[] = [];
  descriptionSearchTerms: string[] = [];
  freeSearch = '';
  NISTIdFilter: string[] = [];
  searchTerm = '';
  severityFilter: Severity[] = [];
  statusFilter: ExtendedControlStatus[] = [];
  tagFilter: string[] = [];
  titleSearchTerms: string[] = [];

  @Mutation
  ADD_CODE(code: string | string[]) {
    this.codeSearchTerms = [...this.codeSearchTerms, ...(Array.isArray(code) ? code : [code])];
  }

  /** Adds a description to the filter */
  @Mutation
  ADD_DESCRIPTION(description: string | string[]) {
    this.descriptionSearchTerms
      = [...this.descriptionSearchTerms, ...(Array.isArray(description) ? description : [description])];
  }

  @Mutation
  ADD_ID(id: string | string[]) {
    this.controlIdSearchTerms = [...this.controlIdSearchTerms, ...(Array.isArray(id) ? id : [id])];
  }

  @Mutation
  ADD_NIST(NISTId: string | string[]) {
    this.NISTIdFilter = [...this.NISTIdFilter, ...(Array.isArray(NISTId) ? NISTId : [NISTId])];
  }

  @Mutation
  ADD_SEVERITY(severity: Severity | Severity[]) {
    this.severityFilter = [...this.severityFilter, ...(Array.isArray(severity) ? severity : [severity])];
  }

  /** Adds a status filter */
  @Mutation
  ADD_STATUS(status: ExtendedControlStatus | ExtendedControlStatus[]) {
    this.statusFilter = [...this.statusFilter, ...(Array.isArray(status) ? status : [status])];
  }

  // Status filtering

  @Mutation
  ADD_TAG(tag: string | string[]) {
    this.tagFilter = [...this.tagFilter, ...(Array.isArray(tag) ? tag : [tag])];
  }

  @Mutation
  ADD_TITLE(title: string | string[]) {
    this.titleSearchTerms = [...this.titleSearchTerms, ...(Array.isArray(title) ? title : [title])];
  }

  /** Adds code to filter */
  @Action
  addCodeFilter(code: string | string[]) {
    this.context.commit('ADD_CODE', code);
  }

  /** Calls the description mutator to add a description to the filter */
  @Action
  addDescriptionFilter(description: string | string[]) {
    this.context.commit('ADD_DESCRIPTION', description);
  }

  /** Adds control id to filter */
  @Action
  addIdFilter(id: string | string[]) {
    this.context.commit('ADD_ID', id);
  }

  /** Adds NIST ID to filter */
  @Action
  addNISTIdFilter(NISTId: string | string[]) {
    this.context.commit('ADD_NIST', NISTId);
  }

  // Generic filtering
  @Action
  addSearchFilter(searchPayload: {
    field: string;
    previousValues: (ExtendedControlStatus | string)[];
    value: string;
  }) {
    // If we already have search filtering
    if (this.searchTerm.trim() === '') {
      this.context.commit(
        'SET_SEARCH',
        `${searchPayload.field}:"${searchPayload.value}"`,
      );
    }
    // We don't have any search yet
    else {
      // If our current filters include the field
      if (
        this.searchTerm.toLowerCase().includes(`${searchPayload.field}:`)
      ) {
        const replaceRegex = new RegExp(`${searchPayload.field}:"(.*?)"`, 'gm');
        const newSearch = this.searchTerm.replace(
          replaceRegex,
          `${searchPayload.field}:"${[...searchPayload.previousValues, searchPayload.value]
            .join(',')}"`,
        );
        this.context.commit('SET_SEARCH', newSearch);
      } // We have a filter already, but it doesn't include the field
      else {
        const newSearch = `${this.searchTerm} ${
          searchPayload.field
        }:"${[...searchPayload.previousValues, searchPayload.value]
          .join(',')}"`;
        this.context.commit('SET_SEARCH', newSearch);
      }
    }
    this.parseSearch();
  }

  // Severity filtering

  /** Adds severity to filter */
  @Action
  addSeverityFilter(severity: Severity | Severity[]) {
    this.context.commit('ADD_SEVERITY', severity);
  }

  @Action
  addStatusFilter(status: ExtendedControlStatus | ExtendedControlStatus[]) {
    this.context.commit('ADD_STATUS', status);
  }

  /** Adds code to filter */
  @Action
  addTagFilter(tag: string | string[]) {
    this.context.commit('ADD_TAG', tag);
  }

  /** Adds a title filter */
  @Action
  addTitleFilter(title: string | string[]) {
    this.context.commit('ADD_TITLE', title);
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
    this.context.commit('CLEAR_TAG');
    this.context.commit('CLEAR_FREESEARCH');
  }

  /** Clears all code filters */
  @Mutation
  CLEAR_CODE() {
    this.codeSearchTerms = [];
  }

  /** Clears all description from the filters */
  @Mutation
  CLEAR_DESCRIPTION() {
    this.descriptionSearchTerms = [];
  }

  /** Removes the current fulltext search */
  @Mutation
  CLEAR_FREESEARCH() {
    this.freeSearch = '';
  }

  // Control ID Filtering

  /** Clears all control ID filters */
  @Mutation
  CLEAR_ID() {
    this.controlIdSearchTerms = [];
  }

  /** Clears all NIST ID filters */
  @Mutation
  CLEAR_NIST() {
    this.NISTIdFilter = [];
  }

  /** Clears all severity filters */
  @Mutation
  CLEAR_SEVERITY() {
    this.severityFilter = [];
  }

  @Mutation
  CLEAR_STATUS() {
    this.statusFilter = [];
  }

  // Title filtering

  /** Clears all code filters */
  @Mutation
  CLEAR_TAG() {
    this.tagFilter = [];
  }

  /** Clears all title filters */
  @Mutation
  CLEAR_TITLE() {
    this.titleSearchTerms = [];
  }

  @Action
  clearSeverityFilter() {
    this.context.commit('CLEAR_SEVERITY');
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
        'input',
        'tags',
      ],
    };
    const searchResult = parse(this.searchTerm, options);
    if (typeof searchResult === 'string') {
      this.setFreesearch(searchResult);
    } else {
      for (const prop in searchResult) {
        const include: string | string[] = searchResult[prop] || '';
        switch (prop) {
          case 'code': {
            this.addCodeFilter(lowercaseAll(include));
            break;
          }
          case 'desc':
          case 'description': {
            this.addDescriptionFilter(lowercaseAll(include));
            break;
          }
          case 'id': {
            this.addIdFilter(lowercaseAll(include));
            break;
          }
          case 'nist': {
            this.addNISTIdFilter(lowercaseAll(include));
            break;
          }
          case 'severity': {
            this.addSeverityFilter(include as Severity | Severity[]);
            break;
          }
          case 'status': {
            this.addStatusFilter(
              include as ExtendedControlStatus | ExtendedControlStatus[],
            );
            break;
          }
          case 'tags': {
            this.addTagFilter(lowercaseAll(include));
            break;
          }
          case 'text': {
            if (typeof include === 'string') {
              this.setFreesearch(include);
            }
            break;
          }
          case 'title': {
            this.addTitleFilter(lowercaseAll(include));
            break;
          }
        }
      }
    }
  }

  // NIST ID Filtering

  @Mutation
  REMOVE_SEVERITY(severity: Severity) {
    this.severityFilter = this.severityFilter.filter(
      filter => filter.toLowerCase() !== severity.toLowerCase(),
    );
  }

  /** Removes a status filter */
  @Mutation
  REMOVE_STATUS(status: ExtendedControlStatus) {
    this.statusFilter = this.statusFilter.filter(
      filter => filter.toLowerCase() !== status.toLowerCase(),
    );
  }

  @Action
  removeSearchFilter(searchPayload: {
    field: string;
    previousValues: (ExtendedControlStatus | string)[];
    value: string;
  }) {
    searchPayload.previousValues = searchPayload.previousValues.filter(
      filter => filter.toLowerCase() !== searchPayload.value.toLowerCase(),
    );
    const replaceRegex = new RegExp(`${searchPayload.field}:"(.*?)"`, 'gm');
    if (searchPayload.previousValues.length > 0) {
      // If we still have any filters
      const newSearch = this.searchTerm.replace(
        replaceRegex,
        `${searchPayload.field}:"${searchPayload.previousValues.join(',')}"`,
      );
      this.context.commit('SET_SEARCH', newSearch);
    } // Otherwise just remove the text from the search bar
    else {
      const newSearch = this.searchTerm.replace(replaceRegex, '');
      this.context.commit('SET_SEARCH', newSearch);
    }
    this.parseSearch();
  }

  // Description Filtering

  @Action
  removeSeverity(severity: Severity) {
    this.context.commit('REMOVE_SEVERITY', severity);
  }

  @Action
  removeStatusFilter(status: ExtendedControlStatus) {
    this.context.commit('REMOVE_STATUS', status);
  }

  @Mutation
  SET_FREESEARCH(text: string) {
    this.freeSearch = text;
  }

  // Code filtering

  /** Sets the control IDs filter */
  @Mutation
  SET_ID(ids: string[]) {
    this.controlIdSearchTerms = ids;
  }

  /** Sets the current search */
  @Mutation
  SET_SEARCH(newSearch: string) {
    this.searchTerm = newSearch;
  }

  /** Sets the severity filter */
  @Mutation
  SET_SEVERITY(severity: Severity[]) {
    this.severityFilter = severity;
  }

  // Tag filtering

  @Mutation
  SET_STATUS(status: ExtendedControlStatus[]) {
    this.statusFilter = status;
  }

  /** Sets the title filters */
  @Mutation
  SET_TITLE(titles: string[]) {
    this.titleSearchTerms = titles;
  }

  /** Sets the current fulltext search */
  @Action
  setFreesearch(search: string) {
    this.context.commit('SET_FREESEARCH', search);
  }

  // Freetext search

  @Action
  setSeverity(severity: Severity[]) {
    this.context.commit('SET_SEVERITY', severity);
  }

  @Action
  setStatusFilter(status: ExtendedControlStatus[]) {
    this.context.commit('SET_STATUS', status);
  }

  /** Update the current search */
  @Action
  updateSearch(newValue: string) {
    if (newValue) {
      this.context.commit('SET_SEARCH', newValue);
    } else {
      this.context.commit('SET_SEARCH', '');
    }
  }
}

export function lowercaseAll(input: string | string[]): string | string[] {
  return typeof input === 'string'
    ? input.toLowerCase()
    : input.map((string) => {
      return string.toLowerCase();
    });
}
export function valueToSeverity(severity: string): Severity {
  return severities.some(severity => severity === severity.toLowerCase()) ? (severity as Severity) : 'none';
}

export const SearchModule = getModule(Search);
