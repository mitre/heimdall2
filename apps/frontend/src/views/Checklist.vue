<template>
  <Base :show-search="true" :title="curr_title">
  <template #topbar-content>
    <v-btn :disabled="!can_clear" @click="clear">
      <span class="d-none d-md-inline pr-2"> Clear </span>
      <v-icon>mdi-filter-remove</v-icon>
    </v-btn>
    <UploadButton />
    <div class="text-center">
      <v-menu>
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" class="mr-2" v-on="on">
            <span class="d-none d-md-inline mr-2"> Export </span>
            <v-icon> mdi-file-export </v-icon>
          </v-btn>
        </template>
        <v-list class="py-0">
          <v-list-item class="px-0">
            <ExportCaat :filter="all_filter" />
          </v-list-item>
          <v-list-item v-if="is_result_view" class="px-0">
            <ExportNist :filter="all_filter" />
          </v-list-item>
          <v-list-item v-if="is_result_view" class="px-0">
            <ExportASFFModal :filter="all_filter" />
          </v-list-item>
          <v-list-item v-if="is_result_view" class="px-0">
            <ExportCKLModal :filter="all_filter" />
          </v-list-item>
          <v-list-item class="px-0">
            <ExportCSVModal :filter="all_filter" />
          </v-list-item>
          <v-list-item v-if="is_result_view" class="px-0">
            <ExportHTMLModal :filter="all_filter" :file-type="current_route_name" />
          </v-list-item>
          <v-list-item v-if="is_result_view" class="px-0">
            <ExportSplunkModal />
          </v-list-item>
          <v-list-item class="px-0">
            <ExportJson />
          </v-list-item>
          <v-list-item class="px-0">
            <ExportXCCDFResults :filter="all_filter" :is-result-view="is_result_view" />
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </template>
  <template #main-content>
    <v-container fluid grid-list-md pt-0 pa-2>
      <v-card class="mt-4">
        <v-card-title>Example Card</v-card-title>
        <v-card-subtitle>Some Data here</v-card-subtitle>
      </v-card>
    </v-container>
  </template>
  </Base>
</template>

<script lang="ts">
import Vue from 'vue';
import Base from './Base.vue';
import Component from 'vue-class-component';
import RouteMixin from '@/mixins/RouteMixin';
import { SearchModule } from '@/store/search';
import { Filter, FilteredDataModule } from '@/store/data_filters';
import { EvaluationFile, FileID, ProfileFile } from '@/store/report_intake';
import { capitalize } from 'lodash';
import { InspecDataModule } from '@/store/data_store';
import { EvaluationModule } from '@/store/evaluations';
import { IEvaluation } from '@heimdall/interfaces';

@Component({
  components: {
    Base
  }
})
export default class Checklist extends RouteMixin {
  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;
  controlSelection: string | null = null;


  /**
   * Returns true if we can currently clear.
   * Essentially, just controls whether the button is available
   */
  get can_clear(): boolean {
    // Return if any params not null/empty
    let result: boolean;
    if (
      SearchModule.severityFilter.length !== 0 ||
      SearchModule.statusFilter.length !== 0 ||
      SearchModule.controlIdSearchTerms.length !== 0 ||
      SearchModule.codeSearchTerms.length !== 0 ||
      this.searchTerm
    ) {
      result = true;
    } else {
      result = false;
    }

    // Logic to check: are any files actually visible?
    if (FilteredDataModule.controls(this.all_filter).length === 0) {
      this.filterSnackbar = true;
    } else {
      this.filterSnackbar = false;
    }

    // Finally, return our result
    return result;
  }

  /**
   * The current search terms, as modeled by the search bar
   */
  get searchTerm(): string {
    return SearchModule.searchTerm;
  }

  /**
   * The title to override with
   */
  get curr_title(): string {
    let returnText = `${capitalize(this.current_route_name.slice(0, -1))} View`;
    if (this.file_filter.length === 1) {
      const file = this.getFile(this.file_filter[0]);
      if (file) {
        const dbFile = this.getDbFile(file);
        returnText += ` (${dbFile?.filename || file.filename} selected)`;
      }
    } else {
      returnText += ` (${this.file_filter.length} ${this.current_route_name} selected)`;
    }
    return returnText;
  }

  getFile(fileID: FileID) {
    return InspecDataModule.allFiles.find((f) => f.uniqueId === fileID);
  }
  getDbFile(file: EvaluationFile | ProfileFile): IEvaluation | undefined {
    return EvaluationModule.evaluationForFile(file);
  }
  set searchTerm(term: string) {
    SearchModule.updateSearch(term);
  }

  /**
   * The filter for charts. Contains all of our filter stuff
   */
  get all_filter(): Filter {
    return {
      status: SearchModule.statusFilter,
      severity: SearchModule.severityFilter,
      fromFile: this.file_filter,
      ids: SearchModule.controlIdSearchTerms,
      titleSearchTerms: SearchModule.titleSearchTerms,
      descriptionSearchTerms: SearchModule.descriptionSearchTerms,
      nistIdFilter: SearchModule.NISTIdFilter,
      searchTerm: SearchModule.freeSearch || '',
      codeSearchTerms: SearchModule.codeSearchTerms,
      omit_overlayed_controls: true,
      control_id: this.controlSelection || undefined
    };
  }

  /**
 * Returns true if we're showing results
 */
  get is_result_view(): boolean {
    return this.current_route === 'results';
  }

  /**
 * The currently selected file, if one exists.
 * Controlled by router.
 */
  get file_filter(): FileID[] {
    if (this.is_result_view) {
      return FilteredDataModule.selectedEvaluationIds;
    } else {
      return FilteredDataModule.selectedProfileIds;
    }
  }
  /**
   * Clear all filters
   */
  clear(clearSearchBar = false) {
    SearchModule.clear();
    this.filterSnackbar = false;
    this.controlSelection = null;
    if (clearSearchBar) {
      this.searchTerm = '';
    }
  }
  get current_route_name(): string {
    return this.$router.currentRoute.path.replace(/[^a-z]/gi, '');
  }
}
</script>
