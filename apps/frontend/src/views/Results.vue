<template>
  <Base
    :show-search="true"
    :title="curr_title"
    @changed-files="evalInfo = null"
  >
    <!-- Topbar content - give it a search bar -->
    <template #topbar-content>
      <v-btn :disabled="!canClear" @click="clear">
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
            <v-list-item v-if="isResultView" class="px-0">
              <ExportCaat :filter="allFilter" />
            </v-list-item>
            <v-list-item v-if="isResultView" class="px-0">
              <ExportNist :filter="allFilter" />
            </v-list-item>
            <v-list-item v-if="isResultView" class="px-0">
              <ExportASFFModal :filter="allFilter" />
            </v-list-item>
            <v-list-item v-if="isResultView" class="px-0">
              <ExportCKLModal :filter="allFilter" />
            </v-list-item>
            <v-list-item v-if="isResultView" class="px-0">
              <ExportCSVModal :filter="allFilter" />
            </v-list-item>
            <v-list-item v-if="isResultView" class="px-0">
              <ExportHTMLModal
                :filter="allFilter"
                :file-type="current_route_name"
              />
            </v-list-item>
            <v-list-item v-if="isResultView" class="px-0">
              <ExportSplunkModal />
            </v-list-item>
            <v-list-item class="px-0">
              <ExportJson />
            </v-list-item>
            <v-list-item v-if="isResultView" class="px-0">
              <ExportXCCDFResults
                :filter="allFilter"
                :is-result-view="isResultView"
              />
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <PrintButton />
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
          :filter="allFilter"
          :current-status-filter="statusFilter"
          @show-errors="showErrors"
          @show-waived="showWaived"
          @add-filter="addStatusSearch"
          @remove-filter="removeStatusFilter"
        />
        <InfoCardRow
          :filter="allFilter"
          @show-severity-overrides="showSeverityOverrides"
          @add-filter="addStatusSearch"
        />
        <!-- Compliance Cards -->
        <v-row id="complianceCards" justify="space-around">
          <v-col xs="4">
            <v-card id="statusCounts" class="fill-height">
              <v-card-title class="justify-center">Status Counts</v-card-title>
              <v-card-actions class="justify-center">
                <StatusChart v-model="statusFilter" :filter="allFilter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card id="severityCounts" class="fill-height">
              <v-card-title class="justify-center"
                >Severity Counts</v-card-title
              >
              <v-card-actions class="justify-center">
                <SeverityChart v-model="severityFilter" :filter="allFilter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card id="complianceLevel" class="fill-height">
              <v-card-title class="justify-center"
                >Compliance Level</v-card-title
              >
              <v-card-actions class="justify-center">
                <ComplianceChart :filter="allFilter" />
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
                  v-model="treeFilters"
                  :filter="treemap_full_filter"
                  :selected_control.sync="controlSelection"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- DataTable -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <ControlTable :filter="allFilter" :show-impact="isResultView" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- Everything-is-filtered snackbar -->
    <v-snackbar
      v-model="enableResultSnackbar"
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
      <span v-else-if="noFiles" class="subtitle-2">
        No files are currently loaded. Press the <strong>LOAD</strong>
        <v-icon class="mx-1"> mdi-cloud-upload</v-icon> button above to load
        some.
      </span>
      <span v-else class="subtitle-2">
        No files are currently enabled for viewing. Open the
        <v-icon class="mx-1">mdi-arrow-right</v-icon> sidebar menu, and ensure
        that the file(s) you wish to view are
        <v-icon class="mx-1">mdi-checkbox-marked</v-icon> checked. If you would
        like to load a file, press the <strong>LOAD</strong>
        <v-icon class="mx-1"> mdi-cloud-upload</v-icon> button above.
      </span>
    </v-snackbar>
  </Base>
</template>

<script lang="ts">
import ComplianceChart from '@/components/cards/ComplianceChart.vue';
import ControlTable from '@/components/cards/controltable/ControlTable.vue';
import EvaluationInfo from '@/components/cards/EvaluationInfo.vue';
import ProfileData from '@/components/cards/ProfileData.vue';
import SeverityChart from '@/components/cards/SeverityChart.vue';
import StatusCardRow from '@/components/cards/StatusCardRow.vue';
import InfoCardRow from '@/components/cards/InfoCardRow.vue';
import StatusChart from '@/components/cards/StatusChart.vue';
import Treemap from '@/components/cards/treemap/Treemap.vue';
import UploadButton from '@/components/generic/UploadButton.vue';
import ExportASFFModal from '@/components/global/ExportASFFModal.vue';
import ExportCaat from '@/components/global/ExportCaat.vue';
import ExportCKLModal from '@/components/global/ExportCKLModal.vue';
import ExportCSVModal from '@/components/global/ExportCSVModal.vue';
import ExportHTMLModal from '@/components/global/ExportHTMLModal.vue';
import ExportJson from '@/components/global/ExportJson.vue';
import ExportNist from '@/components/global/ExportNist.vue';
import PrintButton from '@/components/global/PrintButton.vue';
import ExportSplunkModal from '@/components/global/ExportSplunkModal.vue';
import ExportXCCDFResults from '@/components/global/ExportXCCDFResults.vue';
import RouteMixin from '@/mixins/RouteMixin';
import {
  ExtendedControlStatus,
  ControlsFilter,
  FilteredDataModule,
  TreeMapState
} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {
  EvaluationFile,
  FileID,
  ProfileFile,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import {SearchEntry, SearchModule} from '@/store/search';
import {ServerModule} from '@/store/server';
import Base from '@/views/Base.vue';
import {IEvaluation} from '@heimdall/common/interfaces';
import {Severity} from 'inspecjs';
import {capitalize} from 'lodash';
import Component, {mixins} from 'vue-class-component';
import ServerMixin from '../mixins/ServerMixin';
import {EvaluationModule} from '../store/evaluations';
import {StatusCountModule} from '../store/status_counts';
import {compare_times} from '../utilities/delta_util';

@Component({
  components: {
    Base,
    StatusCardRow,
    InfoCardRow,
    Treemap,
    ControlTable,
    StatusChart,
    SeverityChart,
    ComplianceChart,
    ExportASFFModal,
    ExportCaat,
    ExportCSVModal,
    ExportNist,
    ExportJson,
    ExportXCCDFResults,
    ExportCKLModal,
    ExportHTMLModal,
    PrintButton,
    EvaluationInfo,
    ExportSplunkModal,
    ProfileData,
    UploadButton
  }
})
export default class Results extends mixins(RouteMixin, ServerMixin) {
  /**
   * The current state of the treemap as modeled by the treemap (duh).
   * Once can reliably expect that if a "deep" selection is not null, then its parent should also be not-null.
   */
  treeFilters: TreeMapState = [];
  controlSelection: string | null = null;

  /** Determines if snackbar should be enabled */
  get enableResultSnackbar(): boolean {
    return FilteredDataModule.controls(this.allFilter).length === 0;
  }

  gotStatus: boolean = false;
  gotSeverity: boolean = false;

  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;

  evalInfo:
    | SourcedContextualizedEvaluation
    | SourcedContextualizedProfile
    | null = null;

  /**
   * The current search terms, as modeled by the search bar
   */
  get searchTerm(): string {
    return SearchModule.searchTerm;
  }

  set searchTerm(term: string) {
    SearchModule.updateSearch(term);
  }

  get severityFilter(): SearchEntry<Severity>[] {
    return SearchModule.inFileSearchTerms.severityFilter;
  }

  set severityFilter(severity: SearchEntry<Severity>[]) {
    SearchModule.setSeverity(severity);
  }

  get statusFilter(): SearchEntry<ExtendedControlStatus>[] {
    return SearchModule.inFileSearchTerms.statusFilter;
  }

  set statusFilter(status: SearchEntry<ExtendedControlStatus>[]) {
    SearchModule.setStatusFilter(status);
  }

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID[] {
    if (this.isResultView) {
      return FilteredDataModule.selectedEvaluationIds;
    } else {
      return FilteredDataModule.selectedProfileIds;
    }
  }

  get evaluationFiles(): SourcedContextualizedEvaluation[] {
    return Array.from(FilteredDataModule.evaluations(this.file_filter)).sort(
      compare_times
    );
  }

  get profiles(): SourcedContextualizedProfile[] {
    return Array.from(FilteredDataModule.profiles(this.file_filter));
  }

  get activeFiles(): (
    | SourcedContextualizedEvaluation
    | SourcedContextualizedProfile
  )[] {
    return this.isResultView ? this.evaluationFiles : this.profiles;
  }

  getFile(fileID: FileID) {
    return InspecDataModule.allFiles.find((f) => f.uniqueId === fileID);
  }

  getDbFile(file: EvaluationFile | ProfileFile): IEvaluation | undefined {
    return EvaluationModule.evaluationForFile(file);
  }

  /**
   * Returns true if we're showing results
   */
  get isResultView(): boolean {
    return this.currentRoute === 'results';
  }

  // Returns true if no files are uploaded
  get noFiles(): boolean {
    return InspecDataModule.allFiles.length === 0;
  }

  /**
   * Subset of all filter terms specific for Results
   */
  get allFilter(): ControlsFilter {
    return {
      status: SearchModule.inFileSearchTerms.statusFilter,
      severity: SearchModule.inFileSearchTerms.severityFilter,
      fromFile: this.file_filter,
      ids: SearchModule.inFileSearchTerms.controlId,
      titleSearchTerms: SearchModule.inFileSearchTerms.title,
      descriptionSearchTerms: SearchModule.inFileSearchTerms.description,
      nistIdFilter: SearchModule.inFileSearchTerms.NISTIdFilter,
      codeSearchTerms: SearchModule.inFileSearchTerms.code,
      tagFilter: SearchModule.tagFilter,
      treeFilters: this.treeFilters,
      omit_overlayed_controls: true,
      control_id: this.controlSelection || undefined,
      filenameSearchTerms: SearchModule.fileMetadataSearchTerms.filename,
      userGroupSearchTerms: SearchModule.fileMetadataSearchTerms.group,
      evalTagSearchTerms: SearchModule.fileMetadataSearchTerms.evalTag,
      keywordsSearchTerms: SearchModule.inFileSearchTerms.keywords
    };
  }

  /**
   * The filter for treemap. Omits its own stuff
   */
  get treemap_full_filter(): ControlsFilter {
    return {
      status: SearchModule.inFileSearchTerms.statusFilter || [],
      severity: SearchModule.inFileSearchTerms.severityFilter,
      titleSearchTerms: SearchModule.inFileSearchTerms.title,
      descriptionSearchTerms: SearchModule.inFileSearchTerms.description,
      codeSearchTerms: SearchModule.inFileSearchTerms.code,
      nistIdFilter: SearchModule.inFileSearchTerms.NISTIdFilter,
      ids: SearchModule.inFileSearchTerms.controlId,
      tagFilter: SearchModule.tagFilter,
      fromFile: this.file_filter,
      omit_overlayed_controls: true,
      keywordsSearchTerms: SearchModule.inFileSearchTerms.keywords
    };
  }

  /**
   * Clear all filters
   */
  clear(clearSearchBar = false) {
    SearchModule.clear();
    this.controlSelection = null;
    this.treeFilters = [];
    if (clearSearchBar) {
      this.searchTerm = '';
    }
  }

  /**
   * Returns true if we can currently clear.
   * Essentially, just controls whether the button is available
   */
  get canClear(): boolean {
    // Return if any params not null/empty
    let result: boolean;
    if (
      SearchModule.inFileSearchTerms.severityFilter.length !== 0 ||
      SearchModule.inFileSearchTerms.statusFilter.length !== 0 ||
      SearchModule.inFileSearchTerms.controlId.length !== 0 ||
      SearchModule.inFileSearchTerms.code.length !== 0 ||
      SearchModule.tagFilter.length !== 0 ||
      this.searchTerm ||
      this.treeFilters.length
    ) {
      result = true;
    } else {
      result = false;
    }

    // Finally, return our result
    return result;
  }

  get waivedProfilesExist(): boolean {
    return StatusCountModule.countOf(this.allFilter, 'Waived') >= 1;
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
  toggle_profile(
    file: SourcedContextualizedEvaluation | SourcedContextualizedProfile
  ) {
    if (file === this.evalInfo) {
      this.evalInfo = null;
    } else {
      this.evalInfo = file;
    }
  }

  showErrors() {
    this.searchTerm = 'status:"Profile Error"';
  }

  showWaived() {
    this.searchTerm = 'status:"Waived"';
  }

  showSeverityOverrides() {
    this.searchTerm = 'tags:"severityoverride"';
  }

  addStatusSearch(status: ExtendedControlStatus) {
    SearchModule.addSearchFilter({
      field: 'status',
      value: status,
      negated: false // Defaulted as false
    });
  }

  removeStatusFilter(status: ExtendedControlStatus) {
    SearchModule.removeSearchFilter({
      field: 'status',
      value: status,
      negated: false // Defaulted as false
    });
  }
}
</script>

<style scoped>
.glow {
  box-shadow: 0px 0px 8px 6px #5a5;
}

.bottom-right {
  position: absolute;
  bottom: 0;
  right: 0;
}
</style>
