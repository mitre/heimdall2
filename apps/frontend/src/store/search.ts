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
import {ExtendedControlStatus} from './data_filters';

export interface ISearchState {
  searchTerm: string;
  freeSearch: string;
  titleSearchTerms: string[];
  descriptionSearchTerms: string[];
  controlIdSearchTerms: string[];
  codeSearchTerms: string[];
  nistIdFilter: string[];
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

export function lowercaseAll(input: string | string[]): string | string[] {
  if (typeof input === 'string') {
    return input.toLowerCase();
  } else {
    return input.map((string) => {
      return string.toLowerCase();
    });
  }
}

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
  controlIdSearchTerms: string[] = [];
  codeSearchTerms: string[] = [];
  nistIdFilter: string[] = [];
  descriptionSearchTerms: string[] = [];
  freeSearch = '';
  searchTerm = '';
  statusFilter: ExtendedControlStatus[] = [];
  severityFilter: Severity[] = [];
  titleSearchTerms: string[] = [];

  /** Update the current search */
  @Action
  updateSearch(newValue: string) {
    if (newValue) {
      this.context.commit('SET_SEARCH', newValue);
    } else {
      this.context.commit('SET_SEARCH', '');
    }
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
            this.addSeverity(include as Severity | Severity[]);
            break;
          case 'id':
            this.addIdFilter(lowercaseAll(include));
            break;
          case 'title':
            this.addTitleFilter(lowercaseAll(include));
            break;
          case 'nist':
            this.addnistIdFilter(lowercaseAll(include));
            break;
          case 'desc':
          case 'description':
            this.addDescriptionFilter(lowercaseAll(include));
            break;
          case 'code':
            this.addCodeFilter(lowercaseAll(include));
            break;
          case 'text':
            if (typeof include === 'string') {
              this.setFreesearch(include);
            }
            break;
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
    // If we already have search filtering
    if (this.searchTerm.trim() !== '') {
      // If our current filters include status
      if (this.searchTerm.toLowerCase().indexOf('status:') !== -1) {
        const newSearch = this.searchTerm.replace(
          /status:"(.*?)"/gm,
          `status:"${this.statusFilter.concat(status).join(',')}"`
        );
        this.context.commit('SET_SEARCH', newSearch);
      } // We have a filter already, but it doesn't include status
      else {
        const newSearch = `${this.searchTerm} status:"${this.statusFilter
          .concat(status)
          .join(',')}"`;
        this.context.commit('SET_SEARCH', newSearch);
      }
    }
    // We don't have any search yet
    else {
      this.context.commit('SET_SEARCH', `status:"${status}"`);
    }
    this.parseSearch();
  }

  @Action
  removeStatusSearch(status: ExtendedControlStatus) {
    this.removeStatusFilter(status);
    // If we still have any status filters
    if (this.statusFilter.length !== 0) {
      const newSearch = this.searchTerm.replace(
        /status:"(.*?)"/gm,
        `status:"${this.statusFilter.join(',')}"`
      );
      this.context.commit('SET_SEARCH', newSearch);
    } // Otherwise remove the status filter text from the search bar
    else {
      const newSearch = this.searchTerm.replace(/status:"(.*?)"/gm, '');
      this.context.commit('SET_SEARCH', newSearch);
    }
    this.parseSearch();
  }

  @Action
  addStatusFilter(status: ExtendedControlStatus | ExtendedControlStatus[]) {
    this.context.commit('ADD_STATUS', status);
  }

  @Action
  removeStatusFilter(status: ExtendedControlStatus) {
    this.context.commit('REMOVE_STATUS', status);
  }

  @Action
  clearStatusFilter() {
    this.context.commit('CLEAR_STATUS');
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

  /** Removes a status filter */
  @Mutation
  REMOVE_STATUS(status: ExtendedControlStatus) {
    this.statusFilter = this.statusFilter.filter(
      (filter) => filter.toLowerCase() !== status.toLowerCase()
    );
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
    // If we already have search filtering
    if (this.searchTerm.trim() !== '') {
      // If our current filters include severity
      if (this.searchTerm.toLowerCase().indexOf('severity:') !== -1) {
        const newSearch = this.searchTerm.replace(
          /severity:"(.*?)"/gm,
          `severity:"${this.severityFilter.concat(severity).join(',')}"`
        );
        this.context.commit('SET_SEARCH', newSearch);
      } // We have a filter already, but it doesn't include severity
      else {
        const newSearch = `${this.searchTerm} severity:"${this.severityFilter
          .concat(severity)
          .join(',')}"`;
        this.context.commit('SET_SEARCH', newSearch);
      }
    }
    // We don't have any search yet
    else {
      this.context.commit('SET_SEARCH', `severity:"${severity}"`);
    }
    this.parseSearch();
  }

  @Action
  removeSeveritySearch(severity: Severity) {
    this.removeSeverity(severity);
    if (this.severityFilter.length !== 0) {
      // If we still have any severity filters
      const newSearch = this.searchTerm.replace(
        /severity:"(.*?)"/gm,
        `severity:"${this.severityFilter.join(',')}"`
      );
      this.context.commit('SET_SEARCH', newSearch);
    } // Otherwise just remove the severity text from the search bar
    else {
      const newSearch = this.searchTerm.replace(/severity:"(.*?)"/gm, '');
      this.context.commit('SET_SEARCH', newSearch);
    }
    this.parseSearch();
  }

  /** Adds severity to filter */
  @Action
  addSeverity(severity: Severity | Severity[]) {
    this.context.commit('ADD_SEVERITY', severity);
  }

  @Action
  removeSeverity(severity: Severity) {
    this.context.commit('REMOVE_SEVERITY', severity);
  }

  @Action
  setSeverity(severity: Severity[]) {
    this.context.commit('SET_SEVERITY', severity);
  }

  @Action
  clearSeverityFilter() {
    this.context.commit('CLEAR_SEVERITY');
  }

  @Mutation
  ADD_SEVERITY(severity: Severity | Severity[]) {
    this.severityFilter = this.severityFilter.concat(severity);
  }

  @Mutation
  REMOVE_SEVERITY(severity: Severity) {
    this.severityFilter = this.severityFilter.filter(
      (filter) => filter.toLowerCase() !== severity.toLowerCase()
    );
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
    // If we already have search filtering
    if (this.searchTerm.trim() !== '') {
      // If our current filters include control IDs
      if (this.searchTerm.toLowerCase().indexOf('id:') !== -1) {
        const newSearch = this.searchTerm.replace(
          /id:"(.*?)"/gm,
          `id:"${this.controlIdSearchTerms.concat(id).join(',')}"`
        );
        this.context.commit('SET_SEARCH', newSearch);
      } // We have a filter already, but it doesn't include control ID
      else {
        const newSearch = `${this.searchTerm} id:"${this.controlIdSearchTerms
          .concat(id)
          .join(',')}"`;
        this.context.commit('SET_SEARCH', newSearch);
      }
    }
    // We don't have any search yet
    else {
      this.context.commit('SET_SEARCH', `id:"${id}"`);
    }
    this.parseSearch();
  }

  @Action
  removeIdSearch(id: string) {
    this.removeIdFilter(id);
    if (this.controlIdSearchTerms.length !== 0) {
      // If we still have any control ID filters
      const newSearch = this.searchTerm.replace(
        /id:"(.*?)"/gm,
        `id:"${this.controlIdSearchTerms.join(',')}"`
      );
      this.context.commit('SET_SEARCH', newSearch);
    } // Otherwise just remove the severity text from the search bar
    else {
      const newSearch = this.searchTerm.replace(/id:"(.*?)"/gm, '');
      this.context.commit('SET_SEARCH', newSearch);
    }
    this.parseSearch();
  }

  @Action
  removeIdFilter(id: string) {
    this.context.commit('REMOVE_ID', id);
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

  @Mutation
  REMOVE_ID(id: string) {
    this.controlIdSearchTerms = this.controlIdSearchTerms.filter(
      (filter) => filter.toLowerCase() !== id.toLowerCase()
    );
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
  addnistIdFilter(cciId: string | string[]) {
    this.context.commit('ADD_CCI', cciId);
  }

  @Mutation
  ADD_CCI(cciId: string | string[]) {
    this.nistIdFilter = this.nistIdFilter.concat(cciId);
  }

  /** Sets the CCI IDs filter */
  @Mutation
  SET_CCI(cciIds: string[]) {
    this.nistIdFilter = cciIds;
  }

  /** Clears all CCI ID filters */
  @Mutation
  CLEAR_CCI() {
    this.nistIdFilter = [];
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
