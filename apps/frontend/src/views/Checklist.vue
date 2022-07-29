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
        <v-container fluid>
          <v-row class="mb-2">
            <v-col v-for="n in 4" :v-bind="n" :cols="1">
              <v-switch
                inset
                label="red"
                color="red"
                value="red"
                hide-details
              />
            </v-col>
          </v-row>
        </v-container>
        <v-row>
          <v-col xs="4" :cols="4" height="100%">
            <!-- Data Table -->
            <v-card>
              <v-card-title class="mt-0 pt-0"
                ><div class="mt-n4 pt-n6">Rules</div>
                <v-spacer class="mt-0 pt-0" />
                <v-select
                  v-model="selectedHeaders"
                  :items="headersList"
                  label="Select Columns"
                  class="mt-4 pt-0"
                  multiple
                  outlined
                  return-object
                  :style="{width: '300px'}"
                  dense
                >
                  <template #selection="{item, index}">
                    <v-chip v-if="index < 3" small>
                      <span>{{ item.text }}</span>
                    </v-chip>
                    <span v-if="index === 3" class="grey--text caption"
                      >(+{{ selectedHeaders.length - 2 }} others)</span
                    >
                  </template>
                </v-select>
              </v-card-title>
              <v-card-text>
                <v-data-table
                  disable-pagination
                  dense
                  fixed-header
                  :items="rules"
                  :headers="headers"
                  :search="searchValue"
                  hide-default-footer
                  class="overflow-y-auto"
                  height="70vh"
                  @click:row="showRule"
                >
                  <template #[`item.ruleVersion`]="{item}">
                    {{ truncate(shortStigId(item.ruleVersion), 20) }}
                  </template>
                  <template #[`item.ruleId`]="{item}">
                    {{ truncate(shortRuleId(item.ruleId), 20) }}
                  </template>
                  <template #[`item.vulnNum`]="{item}">
                    {{ truncate(item.vulnNum, 20) }}
                  </template>
                  <template #[`item.groupTitle`]="{item}">
                    {{ truncate(item.groupTitle, 20) }}
                  </template>
                  <template #[`item.ruleTitle`]="{item}">
                    {{ truncate(item.ruleTitle, 100) }}
                  </template>
                  <template #[`item.cciRef`]="{item}">
                    {{ truncate(item.cciRef, 13) }}
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
          <!-- Rule Data -->
          <v-col xs="4" :cols="8">
            <v-card height="40%" class="mt-n16 mb-2">
              <v-card-text>
                <v-row>
                  <v-col :cols="2">
                    <v-select
                      v-model="selectedRule.status"
                      label="Status"
                      :items="[
                        'Not_Reviewed',
                        'Open',
                        'NotAFinding',
                        'Not_Applicable'
                      ]"
                    />
                    <v-select
                      v-model="selectedRule.severityOverride"
                      label="Severity Override"
                      :items="['CAT I', 'CAT II', 'CAT III']"
                    />
                  </v-col>
                  <v-col :cols="10">
                    <strong>Finding Details: </strong><br />
                    <v-textarea
                      v-model="selectedRule.findingDetails"
                      solo
                      outlined
                      dense
                      no-resize
                      height="12vh"
                    />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <v-card class="mt-n12" color="transparent">
                      <strong>Comments: </strong>
                      <v-textarea
                        v-model="selectedRule.comments"
                        solo
                        outlined
                        dense
                        no-resize
                        height="12vh"
                      />
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
            <v-card height="50.5vh" class="overflow-auto">
              <v-card-title>Selected Rule</v-card-title>
              <div v-if="selectedRule.vulnNum !== ''">
                <v-card-text>
                  <strong>Rule Title: </strong><br />
                  {{ selectedRule.ruleTitle }}<br /><br />
                  <strong>Discussion: </strong><br />
                  {{ selectedRule.vulnDiscuss }}<br /><br />
                  <strong>Check Text: </strong><br />
                  {{ selectedRule.checkContent }}<br /><br />
                  <strong>Fix Text: </strong><br />
                  {{ selectedRule.fixText }}<br /><br />
                </v-card-text>
                <v-card-subtitle class="text-center"
                  >References</v-card-subtitle
                >
                <v-card-text>
                  <strong>CCI: </strong>{{ selectedRule.cciRef }}<br /><br />
                </v-card-text>
              </div>
              <div v-else>
                <v-card-text>No rule selected.</v-card-text>
              </div>
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
  FileID,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import {capitalize} from 'lodash';
import {compare_times} from '../utilities/delta_util';
import {Severity} from 'inspecjs';
import {StatusCountModule} from '@/store/status_counts';
import UploadButton from '@/components/generic/UploadButton.vue';
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
import {InspecDataModule} from '@/store/data_store';
import _ from 'lodash';
// import SwitchTable from '@/components/cards/SwitchTable.vue';

@Component({
  components: {
    Base,
    StatusCardRow,
    StatusChart,
    ExportASFFModal,
    ExportCaat,
    ExportCSVModal,
    ExportNist,
    ExportJson,
    ExportXCCDFResults,
    ExportCKLModal,
    ExportHTMLModal,
    ExportSplunkModal,
    UploadButton
    //SwitchTable
  }
})
export default class Checklist extends RouteMixin {
  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;
  controlSelection: string | null = null;

  selectedRule: ChecklistVuln = {
    status: '',
    findingDetails: '',
    comments: '',
    severityOverride: '',
    severityJustification: '',
    vulnNum: '',
    severity: '',
    groupTitle: '',
    ruleId: '',
    ruleVersion: '',
    ruleTitle: '',
    vulnDiscuss: '',
    iaControls: '',
    checkContent: '',
    fixText: '',
    falsePositives: '',
    falseNegatives: '',
    documentable: '',
    mitigations: '',
    potentialImpact: '',
    thirdPartyTools: '',
    mitigationControl: '',
    responsibility: '',
    securityOverrideGuidance: '',
    checkContentRef: '',
    weight: '',
    class: '',
    stigRef: '',
    targetKey: '',
    stigUuid: '',
    legacyId: '',
    cciRef: ''
  };

  selectedHeaders: {text: string; value: string; width: string}[] = [
    {text: 'Status', value: 'status', width: '100px'},
    {text: 'STIG ID', value: 'ruleVersion', width: '100px'},
    {text: 'Rule ID', value: 'ruleId', width: '100px'},
    {text: 'Vul ID', value: 'vulnNum', width: '100px'},
    {text: 'Group Name', value: 'groupTitle', width: '110px'},
    {text: 'CCIs', value: 'cciRef', width: '110px'}
  ];

  headersList = [
    {text: 'Status', value: 'status', width: '100px'},
    {text: 'STIG ID', value: 'ruleVersion', width: '100px'},
    {text: 'Rule ID', value: 'ruleId', width: '100px'},
    {text: 'Vul ID', value: 'vulnNum', width: '100px'},
    {text: 'Group Name', value: 'groupTitle', width: '110px'},
    {text: 'Rule Title', value: 'ruleTitle', width: '500px'},
    {text: 'CCIs', value: 'cciRef', width: '110px'}
  ];

  hiddenRows = [
    {value: 'groupTitle', align: ' d-none'},
    {value: 'ruleTitle', align: ' d-none'}
  ];

  evalInfo:
    | SourcedContextualizedEvaluation
    | SourcedContextualizedProfile
    | null = null;

  truncate(value: string, length: number, omission = '...') {
    return _.truncate(value, {omission: omission, length: length});
  }

  shortRuleId(ruleId: string) {
    return ruleId.split('r')[0] || ruleId;
  }

  shortStigId(stigId: string) {
    return stigId.split('-').slice(0, 2).join('-');
  }

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
    return FilteredChecklistDataModule.selectedChecklistIds;
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

  getChecklist(fileID: FileID) {
    return FilteredChecklistDataModule.allFiles.find(
      (f) => f.uniqueId === fileID
    );
  }

  get searchValue(): string {
    return SearchModule.searchTerm;
  }

  get headers() {
    const selectedHeadersList = this.selectedHeaders.map(
      (header) => header.text
    );
    return [
      ...this.headersList.filter((header) =>
        selectedHeadersList.includes(header.text)
      ),
      ...this.hiddenRows
    ];
  }

  /**
   * Returns true if we're showing a checklist
   */
  get is_checklist_view(): boolean {
    return this.current_route === 'checklist';
  }

  // Returns true if no files are uploaded
  get no_files(): boolean {
    return FilteredChecklistDataModule.allFiles.length === 0;
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

  showRule(rule: ChecklistVuln) {
    // Run selectRule from Checklist store
    this.selectedRule = rule;
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

  get rules() {
    const rulesList: ChecklistVuln[] = [];
    Object.entries(InspecDataModule.allChecklistFiles)
      .map(([_fileId, checklist]) => checklist.stigs)
      .flat()
      .map((stig) => stig.vulns)
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
      const file = this.getChecklist(this.file_filter[0]);
      if (file) {
        returnText += ` (${file.filename} selected)`;
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

<style scoped>
/* .forceup {
  position: absolute;
  top: 10vh;
  right: 0;
} */
</style>
