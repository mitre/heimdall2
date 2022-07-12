<template>
  <Base
    :show-search="true"
    :title="curr_title"
    @changed-files="evalInfo = null"
  >
    <!-- Topbar content - give it a search bar -->
    <template #topbar-content>
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
            <v-list-item v-if="is_checklist_view" class="px-0">
              <ExportNist :filter="all_filter" />
            </v-list-item>
            <v-list-item v-if="is_checklist_view" class="px-0">
              <ExportASFFModal :filter="all_filter" />
            </v-list-item>
            <v-list-item v-if="is_checklist_view" class="px-0">
              <ExportCKLModal :filter="all_filter" />
            </v-list-item>
            <v-list-item class="px-0">
              <ExportCSVModal :filter="all_filter" />
            </v-list-item>
            <v-list-item v-if="is_checklist_view" class="px-0">
              <ExportHTMLModal
                :filter="all_filter"
                :file-type="current_route_name"
              />
            </v-list-item>
            <v-list-item v-if="is_checklist_view" class="px-0">
              <ExportSplunkModal />
            </v-list-item>
            <v-list-item class="px-0">
              <ExportJson />
            </v-list-item>
            <v-list-item class="px-0">
              <ExportXCCDFResults
                :filter="all_filter"
                :is-result-view="is_checklist_view"
              />
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </template>
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
          :filter="all_filter"
          :current-status-filter="statusFilter"
          @show-errors="showErrors"
          @show-waived="showWaived"
          @add-filter="addStatusSearch"
          @remove-filter="removeStatusFilter"
        />
        <!-- Compliance Cards -->
        <v-row id="complianceCards" justify="space-around">
          <v-col xs="4">
            <v-card id="statusCounts" class="fill-height">
              <v-card-title class="justify-center">Status Counts</v-card-title>
              <v-card-actions class="justify-center">
                <StatusChart v-model="statusFilter" :filter="all_filter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card id="severityCounts" class="fill-height">
              <v-card-title class="justify-center"
                >Severity Counts</v-card-title
              >
              <v-card-actions class="justify-center">
                <SeverityChart v-model="severityFilter" :filter="all_filter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card id="complianceLevel" class="fill-height">
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
        <!-- DataTable -->
        <v-row>
          <v-col xs="4">
            <v-card>
              <v-card-title>Rules</v-card-title>
              <v-card-text>
                <v-simple-table dense height="25vh" fixed-header>
                  <template #default>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Vuln ID</th>
                        <th>Rule ID</th>
                        <th>Rule Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="rule in rules"
                        :key="rule.ruleId"
                        @click="showRule(rule)"
                      >
                        <td>{{ rule.status }}</td>
                        <td>{{ rule.vulnNum }}</td>
                        <td>{{ rule.ruleId }}</td>
                        <td>{{ rule.ruleTitle }}</td>
                      </tr>
                    </tbody></template
                  >
                </v-simple-table>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card height="60%">
              <v-card-title>DATA WILL GO HERE</v-card-title>
              <v-card-subtitle>DATA WILL GO HERE</v-card-subtitle>
              <pre>
{{ 'something' }} <br />{{ 'something Else' }}
              </pre>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </Base>
</template>

<script lang="ts">
import Base from './Base.vue';
import Component from 'vue-class-component';
import RouteMixin from '@/mixins/RouteMixin';
import {SearchModule} from '@/store/search';
import {
  ExtendedControlStatus,
  Filter,
  FilteredDataModule
} from '@/store/data_filters';
import {FilteredChecklistDataModule} from '@/store/checklist_data_filters';
import {
  EvaluationFile,
  FileID,
  ProfileFile,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import {capitalize} from 'lodash';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationModule} from '@/store/evaluations';
import {IEvaluation} from '@heimdall/interfaces';
import {compare_times} from '../utilities/delta_util';
import {Severity} from 'inspecjs';
import {StatusCountModule} from '@/store/status_counts';
import UploadButton from '@/components/generic/UploadButton.vue';
import ComplianceChart from '@/components/cards/ComplianceChart.vue';
import ControlTable from '@/components/cards/controltable/ControlTable.vue';
import EvaluationInfo from '@/components/cards/EvaluationInfo.vue';
import ProfileData from '@/components/cards/ProfileData.vue';
import SeverityChart from '@/components/cards/SeverityChart.vue';
import StatusCardRow from '@/components/cards/StatusCardRow.vue';
import StatusChart from '@/components/cards/StatusChart.vue';
import ExportASFFModal from '@/components/global/ExportASFFModal.vue';
import ExportCaat from '@/components/global/ExportCaat.vue';
import ExportCKLModal from '@/components/global/ExportCKLModal.vue';
import ExportCSVModal from '@/components/global/ExportCSVModal.vue';
import ExportHTMLModal from '@/components/global/ExportHTMLModal.vue';
import ExportJson from '@/components/global/ExportJson.vue';
import ExportNist from '@/components/global/ExportNist.vue';
import ExportSplunkModal from '@/components/global/ExportSplunkModal.vue';
import ExportXCCDFResults from '@/components/global/ExportXCCDFResults.vue';
import {ChecklistVuln} from '../types/checklist/control';

@Component({
  components: {
    Base,
    StatusCardRow,
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
    EvaluationInfo,
    ExportSplunkModal,
    ProfileData,
    UploadButton
  }
})
export default class Checklist extends RouteMixin {
  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;
  controlSelection: string | null = null;

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

  get severityFilter(): Severity[] {
    return SearchModule.severityFilter;
  }

  set severityFilter(severity: Severity[]) {
    SearchModule.setSeverity(severity);
  }

  get statusFilter(): ExtendedControlStatus[] {
    return SearchModule.statusFilter;
  }

  set statusFilter(status: ExtendedControlStatus[]) {
    SearchModule.setStatusFilter(status);
  }

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID[] {
    if (this.is_checklist_view) {
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
    return this.is_checklist_view ? this.evaluationFiles : this.profiles;
  }

  getFile(fileID: FileID) {
    return InspecDataModule.allFiles.find((f) => f.uniqueId === fileID);
  }

  getDbFile(file: EvaluationFile | ProfileFile): IEvaluation | undefined {
    return EvaluationModule.evaluationForFile(file);
  }

  /**
   * Returns true if we're showing a checklist
   */
  get is_checklist_view(): boolean {
    return this.current_route === 'checklist';
  }

  // Returns true if no files are uploaded
  get no_files(): boolean {
    return InspecDataModule.allFiles.length === 0;
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

  showRule(rule: Record<string, unknown>) {
    // Run selectRule from Checklist store
    console.log(rule);
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

  get waivedProfilesExist(): boolean {
    return StatusCountModule.countOf(this.all_filter, 'Waived') >= 1;
  }

  get headers() {
    return [
      {text: 'Status', value: 'status'},
      {text: 'Vul ID', value: 'vulId'},
      {text: 'Rule ID', value: 'ruleId'},
      {text: 'Rule Name', value: 'ruleName'}
    ];
  }

  get rules() {
    const rulesList: ChecklistVuln[] = [];
    Object.entries(FilteredChecklistDataModule.loadedChecklists)
      .map(([_fileId, checklist]) => checklist.vulns)
      .forEach((rulesItems) => {
        rulesList.push(...rulesItems);
      });
    return rulesList;
  }

  /**
   * The title to override with
   */
  get curr_title(): string {
    let returnText = `${capitalize(this.current_route_name)} View`;
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

  addStatusSearch(status: ExtendedControlStatus) {
    SearchModule.addSearchFilter({
      field: 'status',
      value: status,
      previousValues: this.statusFilter
    });
  }

  removeStatusFilter(status: ExtendedControlStatus) {
    SearchModule.removeSearchFilter({
      field: 'status',
      value: status,
      previousValues: this.statusFilter
    });
  }
}
</script>
