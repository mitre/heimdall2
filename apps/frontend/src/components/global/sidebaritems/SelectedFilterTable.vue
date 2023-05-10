<template>
  <div>
    <h1 class="my-4">Selected Filters:</h1>
    <v-row class="mt-4 mx-auto">
      <v-data-table
        v-model="selectedFilters"
        dense
        show-select
        :headers="filterHeaders"
        :items="convertFilterData(currentFilters.conditionArray)"
        item-key="value"
        class="elevation-1 mb-3 testing"
      />
    </v-row>
    <v-row
      class="mt-2 mx-auto"
      style="
        padding-top: 0.75rem;
        padding-bottom: 5rem;
        align-items: center;
        justify-content: center;
      "
    >
      <v-btn
        id="remove-filters-btn"
        class="mx-2"
        @click="removeSelectedFilters"
      >
        <span class="d-none d-md-inline"> Remove Filter(s) </span>
      </v-btn>
      <v-btn id="clear-all-btn" class="mx-2" @click="removeAllFilters">
        <span class="d-none d-md-inline"> Remove All Filters </span>
      </v-btn>
    </v-row>
  </div>
</template>

<script lang="ts">
import {SearchModule} from '@/store/search';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class SelectedFilterTable extends Vue {
  /** Returns the current parsed search result */
  get currentFilters() {
    return SearchModule.parsedSearchResult;
  }

  selectedFilters: {keyword: string; value: string; negated: string}[] = [];
  /** Removes selected filters from data table */
  removeSelectedFilters() {
    for (const filterItem of this.selectedFilters) {
      const field = filterItem.keyword;
      const value = filterItem.value;
      let negated = false;
      if (filterItem.negated === '-') {
        negated = true;
      }
      SearchModule.removeSearchFilter({
        field,
        value,
        negated
      });
    }
  }

  /** Headers that are displayed on top of selected filters data table */
  filterHeaders = [
    {
      text: '+ / -',
      align: 'start',
      value: 'negated'
    },
    {text: 'Keyword', align: 'start', value: 'value'},
    {text: 'Filter', align: 'start', value: 'keyword'}
  ];

  /** Converts the active filters into array that can be ingested by selected filter data table */
  convertFilterData(
    filters: {keyword: string; value: string; negated: boolean}[]
  ) {
    let temp: {keyword: string; value: string; negated: string}[] = [];
    for (const filterEntry of filters) {
      filterEntry.negated
        ? temp.push({
            keyword: filterEntry.keyword,
            value: filterEntry.value,
            negated: '-'
          })
        : temp.push({
            keyword: filterEntry.keyword,
            value: filterEntry.value,
            negated: '+'
          });
    }
    return temp;
  }

  removeAllFilters() {
    SearchModule.clear();
    this.selectedFilters = [];
    SearchModule.updateSearch('');
  }
}
</script>

<style lang="scss" scoped>
.v-data-table::v-deep th {
  font-size: 1rem !important;
}

.v-data-table::v-deep td {
  font-size: 1rem !important;
}
</style>
