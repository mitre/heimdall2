<template>
  <BaseView :title="curr_title" @changed-files="evalInfo = null">
    <!-- Topbar content - give it a search bar -->
    <template #topbar-content>
      <v-text-field
        v-show="show_search_mobile || !$vuetify.breakpoint.xs"
        ref="search"
        v-model="searchTerm"
        flat
        hide-details
        dense
        solo
        prepend-inner-icon="mdi-magnify"
        append-icon="mdi-help-circle-outline"
        label="Search"
        clearable
        :class="$vuetify.breakpoint.xs ? 'overtake-bar mx-2' : 'mx-2'"
        @input="isTyping = true"
        @click:clear="clear_search()"
        @click:append="showSearchHelp = true"
        @blur="show_search_mobile = false"
      />
      <SearchHelpModal
        :visible="showSearchHelp"
        @close-modal="showSearchHelp = false"
      />
      <v-btn v-if="$vuetify.breakpoint.xs" class="mr-2" @click="showSearch">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
      <v-btn :disabled="!can_clear" @click="clear">
        <span class="d-none d-md-inline pr-2"> Clear </span>
        <v-icon>mdi-filter-remove</v-icon>
      </v-btn>
      <UploadButton />
      <div class="text-center">
        <v-menu>
          <template #activator="{on, attrs}">
            <v-btn v-bind="attrs" class="mr-2" v-on="on">
              <span class="d-none d-md-inline mr-2"> Export </span>
              <v-icon> mdi-file-export </v-icon>
            </v-btn>
          </template>
          <v-list class="py-0">
            <v-list-item class="px-0">
              <ExportCaat :filter="all_filter" />
            </v-list-item>
            <v-list-item class="px-0">
              <ExportNist :filter="all_filter" />
            </v-list-item>
            <v-list-item class="px-0">
              <ExportJson />
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </template>

    <!-- The main content: cards, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pt-0 pa-2>
        <v-container id="fileCards" mx-0 px-0 fluid>
          <!-- Evaluation Info -->
          <v-row no-gutters class="mx-n3 mb-3">
            <v-col>
              <v-slide-group v-model="evalInfo" show-arrows>
                <v-slide-item v-for="(file, i) in activeFiles" :key="i">
                  <v-card
                    width="100%"
                    max-width="100%"
                    class="mx-3"
                    data-cy="profileInfo"
                    @click="toggle_profile(file)"
                  >
                    <EvaluationInfo :file="file" />
                    <v-card-actions>
                      <div
                        v-if="
                          file.from_file.database_id &&
                          getDbFile(file.from_file).editable
                        "
                        class="top-right"
                      >
                        <EditEvaluationModal
                          id="editEvaluationModal"
                          :active="getDbFile(file.from_file)"
                        >
                          <template #clickable="{on}"
                            ><v-icon
                              data-cy="edit"
                              title="Edit"
                              class="mr-3 mt-3"
                              v-on="on"
                            >
                              mdi-pencil
                            </v-icon>
                          </template>
                        </EditEvaluationModal>
                      </div>
                    </v-card-actions>
                    <v-card-subtitle class="bottom-right">
                      File Info ↓
                    </v-card-subtitle>
                  </v-card>
                </v-slide-item>
              </v-slide-group>
            </v-col>
          </v-row>
          <ProfileData
            v-if="evalInfo != null"
            class="my-4 mx-2"
            :file="evalInfo"
          />
        </v-container>
        <!-- Count Cards -->
        <StatusCardRow
          :filter="all_filter"
          :current-status-filter="statusFilter"
          @show-errors="searchTerm = 'status:Profile Error'"
          @show-waived="searchTerm = 'status:Waived'"
        />
        <!-- Compliance Cards -->
        <v-row justify="space-around">
          <v-col xs="4">
            <v-card class="fill-height">
              <v-card-title class="justify-center">Status Counts</v-card-title>
              <v-card-actions class="justify-center">
                <StatusChart v-model="statusFilter" :filter="all_filter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card class="fill-height">
              <v-card-title class="justify-center"
                >Severity Counts</v-card-title
              >
              <v-card-actions class="justify-center">
                <SeverityChart v-model="severityFilter" :filter="all_filter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card class="fill-height">
              <v-card-title class="justify-center"
                >Compliance Level</v-card-title
              >
              <v-card-actions class="justify-center">
                <ComplianceChart :filter="all_filter" />
              </v-card-actions>
              <v-card-text style="text-align: center"
                >[Passed/(Passed + Failed + Not Reviewed + Profile Error<span
                  v-if="waivedProfilesExist"
                >
                  + Waived</span
                >) * 100]</v-card-text
              >
            </v-card>
          </v-col>
        </v-row>

        <!-- TreeMap and Partition Map -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <v-card-title>Tree Map</v-card-title>
              <v-card-text>
                <Treemap
                  v-model="tree_filters"
                  :filter="treemap_full_filter"
                  :selected_control.sync="control_selection"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- DataTable -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <ControlTable
                :filter="all_filter"
                :show-impact="is_result_view"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- Everything-is-filtered snackbar -->
    <v-snackbar
      v-model="filter_snackbar"
      class="mt-11"
      style="z-index: 2"
      :timeout="-1"
      color="warning"
      top
    >
      <span v-if="file_filter.length" class="subtitle-2">
        All results are filtered out. Use the
        <v-icon>mdi-filter-remove</v-icon> button in the top right to clear
        filters and show all.
      </span>
      <span v-else-if="no_files" class="subtitle-2">
        No files are currently loaded. Press the <strong>LOAD</strong>
        <v-icon class="mx-1"> mdi-cloud-upload</v-icon> button above to load
        some.
      </span>
      <span v-else class="subtitle-2">
        No files are currently enabled for viewing. Open the
        <v-icon class="mx-1">mdi-menu</v-icon> sidebar menu, and ensure that the
        file(s) you wish to view are
        <v-icon class="mx-1">mdi-checkbox-marked</v-icon> checked.
      </span>
    </v-snackbar>
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import Component, {mixins} from 'vue-class-component';
import BaseView from '@/views/BaseView.vue';

import StatusCardRow from '@/components/cards/StatusCardRow.vue';
import ControlTable from '@/components/cards/controltable/ControlTable.vue';
import Treemap from '@/components/cards/treemap/Treemap.vue';
import StatusChart from '@/components/cards/StatusChart.vue';
import SeverityChart from '@/components/cards/SeverityChart.vue';
import ComplianceChart from '@/components/cards/ComplianceChart.vue';
import UploadButton from '@/components/generic/UploadButton.vue';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import SearchHelpModal from '@/components/global/SearchHelpModal.vue'

import ExportCaat from '@/components/global/ExportCaat.vue';
import ExportNist from '@/components/global/ExportNist.vue';
import ExportJson from '@/components/global/ExportJson.vue';
import EvaluationInfo from '@/components/cards/EvaluationInfo.vue';

import {FilteredDataModule, Filter, TreeMapState, ExtendedControlStatus} from '@/store/data_filters';
import {Severity} from 'inspecjs';
import {EvaluationFile, FileID, ProfileFile, SourcedContextualizedEvaluation, SourcedContextualizedProfile} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';

import ProfileData from '@/components/cards/ProfileData.vue';

import {ServerModule} from '@/store/server';
import {capitalize} from 'lodash';
import {compare_times} from '../utilities/delta_util';
import {EvaluationModule} from '../store/evaluations';
import RouteMixin from '@/mixins/RouteMixin';
import {StatusCountModule} from '../store/status_counts';
import ServerMixin from '../mixins/ServerMixin';
import {IEvaluation} from '@heimdall/interfaces';
import {Watch} from 'vue-property-decorator';
import {SearchModule} from '@/store/search';

@Component({
  components: {
    BaseView,
    StatusCardRow,
    Treemap,
    ControlTable,
    StatusChart,
    SeverityChart,
    ComplianceChart,
    ExportCaat,
    ExportNist,
    ExportJson,
    EvaluationInfo,
    ProfileData,
    SearchHelpModal,
    UploadButton,
    EditEvaluationModal
  }
})
export default class Results extends mixins(RouteMixin, ServerMixin) {
  $refs!: Vue['$refs'] & {
    search: HTMLInputElement;
  };

  /**
   * The current state of the treemap as modeled by the treemap (duh).
   * Once can reliably expect that if a "deep" selection is not null, then its parent should also be not-null.
   */
  tree_filters: TreeMapState = [];
  control_selection: string | null = null;

  /**
   * If the user is currently typing in the search bar
   */
  typingTimer = setTimeout(() => {return}, 0);

  /** Model for if all-filtered snackbar should be showing */
  filter_snackbar: boolean = false;

  evalInfo: SourcedContextualizedEvaluation | SourcedContextualizedProfile | null = null;

  /** Determines if we should make the search bar collapse-able */
  show_search_mobile: boolean = false;

  /** If we are currently showing the search help modal */
  showSearchHelp = false;

  /**
   * The current search terms, as modeled by the search bar
   */
  get searchTerm() {
    return SearchModule.searchTerm;
  }
  set searchTerm(term: string) {
    SearchModule.updateSearch(term);
  }

  get severityFilter(): Severity[] {
    return SearchModule.severityFilter;
  }
  set severityFilter(severity: Severity[]) {
    SearchModule.setSeverity(severity)
  }

  get statusFilter(): ExtendedControlStatus[] {
    return SearchModule.statusFilter;
  }
  set statusFilter(status: ExtendedControlStatus[]) {
    SearchModule.setStatusFilter(status);
  }

  @Watch('searchTerm')
  onUpdateSearch(_newValue: string) {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.typingTimer = setTimeout(this.onDoneTyping, 1000);
  }

  @Watch('isTyping')
  onDoneTyping() {
    this.clear()
    SearchModule.parseSearch();
  }

  capitalizeMultiple(string: string | undefined): string{
    if (typeof string !== 'string') {
      return ''
    }
    const words = string.split(" ");
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    return words.join(' ')
  }

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID[] {
    if (this.is_result_view) {
      return FilteredDataModule.selectedEvaluationIds;
    }
    else {
      return FilteredDataModule.selectedProfileIds;
    }
  }

  get evaluationFiles(): SourcedContextualizedEvaluation[] {
    return Array.from(FilteredDataModule.evaluations(this.file_filter)).sort(compare_times);
  }

  get profiles(): SourcedContextualizedProfile[] {
    return Array.from(FilteredDataModule.profiles(this.file_filter));
  }

  get activeFiles(): (SourcedContextualizedEvaluation | SourcedContextualizedProfile)[] {
    return this.is_result_view ? this.evaluationFiles : this.profiles;
  }

  getFile(fileID: FileID) {
    return InspecDataModule.allFiles.find(
      (f) => f.unique_id === fileID
    );
  }

  getDbFile(file: EvaluationFile | ProfileFile): IEvaluation | undefined {
    return EvaluationModule.allEvaluations.find((e) => {
      return e.id === file.database_id?.toString()
    })
  }

  /**
   * Returns true if we're showing results
   */
  get is_result_view(): boolean {
    return this.current_route === 'results';
  }

  // Returns true if no files are uploaded
  get no_files(): boolean {
    return InspecDataModule.allFiles.length === 0;
  }

  /**
   * Handles focusing on the search bar
   */
  showSearch(): void {
    this.show_search_mobile = true;
    this.$nextTick(() => {
      this.$refs.search.focus();
    });
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
      cciIdFilter: SearchModule.cciIdFilter,
      searchTerm: SearchModule.freeSearch || '',
      codeSearchTerms: SearchModule.codeSearchTerms,
      tree_filters: this.tree_filters,
      omit_overlayed_controls: true,
      control_id: this.control_selection || undefined
    };
  }

  /**
   * The filter for treemap. Omits its own stuff
   */
  get treemap_full_filter(): Filter {
    return {
      status: SearchModule.statusFilter || [],
      severity: SearchModule.severityFilter,
      titleSearchTerms: SearchModule.titleSearchTerms,
      descriptionSearchTerms: SearchModule.descriptionSearchTerms,
      codeSearchTerms: SearchModule.codeSearchTerms,
      cciIdFilter: SearchModule.cciIdFilter,
      ids: SearchModule.controlIdSearchTerms,
      fromFile: this.file_filter,
      searchTerm: SearchModule.freeSearch,
      omit_overlayed_controls: true
    };
  }

  /**
   * Clear all filters
   */
  clear(clearSearchBar = false) {
    SearchModule.clear();
    this.filter_snackbar = false;
    this.control_selection = null;
    this.tree_filters = [];
    if(clearSearchBar) {
      this.searchTerm = '';
    }
  }

  clear_search() {
    this.searchTerm = '';
  }

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
      this.searchTerm ||
      this.tree_filters.length
    ) {
      result = true;
    } else {
      result = false;
    }

    // Logic to check: are any files actually visible?
    if (FilteredDataModule.controls(this.all_filter).length === 0) {
      this.filter_snackbar = true;
    } else {
      this.filter_snackbar = false;
    }

    // Finally, return our result
    return result;
  }

  get waivedProfilesExist(): boolean {
    return StatusCountModule.countOf(this.all_filter, 'Waived') >= 1
  }

  /**
   * The title to override with
   */
  get curr_title(): string {
    let returnText = `${capitalize(this.current_route_name.slice(0, -1))} View`;
    if (this.file_filter.length === 1) {
      const file = this.getFile(this.file_filter[0])
      if (file) {
        const dbFile = this.getDbFile(file);
        returnText += ` (${dbFile?.filename || file.filename} selected)`;
      }
    } else {
      returnText += ` (${this.file_filter.length} ${this.current_route_name} selected)`;
    }
    return returnText;
  }

  get current_route_name(): string {
    return this.$router.currentRoute.path.replace(/[^a-z]/gi, '');
  }

  //changes width of eval info if it is in server mode and needs more room for tags
  get info_width(): number {
    if (ServerModule.serverMode) {
      return 500;
    }
    return 300;
  }

  //basically a v-model for the eval info cards when there is no slide group
  toggle_profile(file: SourcedContextualizedEvaluation | SourcedContextualizedProfile) {
    if (file === this.evalInfo) {
      this.evalInfo = null;
    } else {
      this.evalInfo = file;
    }
  }
}
</script>

<style scoped>
.glow {
  box-shadow: 0px 0px 8px 6px #5a5;
}
.overtake-bar {
  width: 96%;
  position: absolute;
  left: 0px;
  top: 4px;
  z-index: 5;
}
.bottom-right {
  position: absolute;
  bottom: 0;
  right: 0;
}
.top-right {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
