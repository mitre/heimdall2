<template>
  <Base :show-search="true" :title="curr_title" @changed-files="evalInfo = null">
  <!-- Topbar content - give it a search bar -->
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
            <ExportHTMLModal :filter="all_filter" :file-type="current_route_name" />
          </v-list-item>
          <v-list-item v-if="is_checklist_view" class="px-0">
            <ExportSplunkModal />
          </v-list-item>
          <v-list-item class="px-0">
            <ExportJson />
          </v-list-item>
          <v-list-item class="px-0">
            <ExportXCCDFResults :filter="all_filter" :is-result-view="is_checklist_view" />
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </template>
  <template #main-content>
    <v-container fluid grid-list-md pt-0 mt-4 mx-1>
      <v-row>
        <v-col md="4" :cols="12">
          <v-card height="25vh" class="overflow-auto">
            <v-tabs v-model="tab" show-arrows center-active grow>
              <v-tab> Benchmarks </v-tab>
              <v-tab> Filters </v-tab>
              <v-tab> Target Data </v-tab>
              <v-tab> Technology Area </v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
              <!-- Benchmarks -->
              <v-tab-item />
              <!-- Filters -->
              <v-tab-item grid-list-md class="pa-4">
                <v-row>
                  <v-col v-for="item in controlStatusSwitches" :key="item.name" :cols="3">{{ item.name }}</v-col>
                </v-row>
                <v-row class="mt-n10">
                  <v-col v-for="item in controlStatusSwitches" :key="item.name" :cols="3">
                    <v-switch v-model="item.enabled" dense justify="center" inset :color="item.color"
                      :label="numStatus(item.value)" hide-details />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col v-for="item in severitySwitches" :key="item.name" :cols="3">{{ item.name }}</v-col>
                </v-row>
                <v-row class="mt-n10">
                  <v-col v-for="item in severitySwitches" :key="item.name" :cols="3">
                    <v-switch v-model="item.enabled" dense justify="center" inset :color="item.color"
                      :label="numSeverity(item.value)" hide-details />
                  </v-col>
                </v-row>
              </v-tab-item>
              <!-- Target Data -->
              <v-tab-item class="pa-4">
                <v-select outlined dense :items="['Computing', 'Non-Computing']"
                  v-model="selectedChecklistAsset.assettype" />
                <v-text-field dense label="Marking" v-model="selectedChecklistAsset.marking" />
                <v-text-field dense label="Host Name" v-model="selectedChecklistAsset.hostname" />
                <v-text-field dense label="IP Address" v-model="selectedChecklistAsset.hostip" />
                <v-text-field dense label="MAC Address" v-model="selectedChecklistAsset.hostmac" />
                <v-text-field dense label="Fully Qualified Domain Name" v-model="selectedChecklistAsset.hostfqdn" />
                <v-text-field dense label="Target Comments" v-model="selectedChecklistAsset.targetcomment" />
                <br />
                <strong>Role</strong>
                <v-radio-group v-model="selectedChecklistAsset.role">
                  <v-radio label="None" value="None" />
                  <v-radio label="Workstation" value="Workstation" />
                  <v-radio label="Member Server" value="Member Server" />
                  <v-radio label="Domain Controller" value="Domain Controller" />
                </v-radio-group>
                <v-checkbox v-model="selectedChecklistAsset.webordatabase" label="Website or Database STIG"
                  hide-details />
                <v-text-field v-if="selectedChecklistAsset.webordatabase" label="Site"
                  v-model="selectedChecklistAsset.webdbsite" />
                <v-text-field v-if="selectedChecklistAsset.webordatabase" label="Instance"
                  v-model="selectedChecklistAsset.webdbinstance" />
              </v-tab-item>
              <!-- Technology Area -->
              <v-tab-item class="pa-4">
                <v-select dense outlined :items="techAreaLabels" justify="center"
                  v-model="selectedChecklistAsset.techarea" />
              </v-tab-item>
            </v-tabs-items>
          </v-card>
          <!-- Data Table -->
          <v-card class="mt-4" height="62vh" overflow-auto>
            <v-card-title class="pt-2">
              <div>
                Rules ({{ numItems }} shown,
                {{ loadedRules.length - numItems }} hidden)
              </div>
              <v-spacer class="mt-0 pt-0" />
              <v-select v-model="selectedHeaders" :items="headersList" label="Select Columns" class="mt-4 pt-0" multiple
                outlined return-object height="5vh">
                <template #selection="{ item, index }">
                  <v-chip v-if="index < 4" small>
                    <span>{{ item.text }}</span>
                  </v-chip>
                  <span v-if="index === 4" class="grey--text caption">(+{{ selectedHeaders.length - 4 }} others)</span>
                </template>
              </v-select>
            </v-card-title>
            <v-card-text>
              <v-data-table ref="dataTable" :single-select="true" disable-pagination dense fixed-header :items="rules"
                :item-class="checkSelected" :headers="headers" :search="searchValue" hide-default-footer
                class="overflow-y-auto" height="42vh" @click:row="showRule" @current-items="getFiltered">
                <template #[`item.status`]="{ item }">
                  {{ shortStatus(mapStatus(item.status)) }}
                </template>
                <template #[`item.ruleVersion`]="{ item }">
                  {{ truncate(shortStigId(item.ruleVersion), 20) }}
                </template>
                <template #[`item.ruleId`]="{ item }">
                  {{ truncate(shortRuleId(item.ruleId), 20) }}
                </template>
                <template #[`item.cciRef`]="{ item }">
                  {{ truncate(shortRuleId(item.cciRef), 15) }}
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <!-- Rule Data -->
        <v-col md="8" :cols="12">
          <v-card height="10vh" class="overflow-y-auto">
            <v-card-text class="text-center">
              <strong>{{ selectedRule.stigRef }}</strong>
              <v-row dense class="mt-2">
                <v-col><strong>Vul ID: </strong>{{ selectedRule.vulnNum }}</v-col>
                <v-col><strong>Rule ID: </strong>{{ shortRuleId(selectedRule.ruleId) }}</v-col>
                <v-col><strong>STIG ID: </strong>{{ shortStigId(selectedRule.ruleVersion) }}</v-col>
              </v-row>
              <v-row dense class="pa-0">
                <v-col><strong>Severity: </strong>{{ selectedRule.severity }}</v-col>
                <v-col><strong>Classification: </strong>{{ selectedRule.class }}</v-col>
                <v-col><strong>Legacy IDs: </strong>{{ selectedRule.legacyId }}</v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <v-card height="40vh" class="overflow-auto mt-4 pt-2">
            <div v-if="selectedRule.ruleId !== ''">
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
              <v-card-subtitle class="text-center">References</v-card-subtitle>
              <v-card-text>
                <strong>CCI: </strong>{{ selectedRule.cciRef }}<br /><br />
              </v-card-text>
            </div>
            <div v-else>
              <v-card-text>No rule selected.</v-card-text>
            </div>
          </v-card>
          <v-card class="mt-4 pt-4">
            <v-card-text>
              <v-row>
                <v-col>
                  <v-select v-model="selectedRule.status" dense label="Status" :items="statusItems" item-text="name"
                    item-value="value" />
                </v-col>
                <v-col>
                  <v-select v-model="selectedRule.severityOverride" dense label="Severity Override" item-text="name"
                    item-value="value" :items="checkPossibleOverrides(selectedRule.severity)"
                    @change="promptSeverityJustification" />
                </v-col>
              </v-row>
              <v-row class="mt-n8">
                <v-col>
                  <strong>Finding Details: </strong><br />
                  <v-textarea v-model="selectedRule.findingDetails" solo outlined dense no-resize height="12vh" />
                </v-col>
              </v-row>
              <v-row class="mt-n10">
                <v-col>
                  <strong>Comments: </strong>
                  <v-textarea v-model="selectedRule.comments" solo outlined dense no-resize height="8vh" />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <div class="text-center">
        <v-bottom-sheet v-model="sheet" persistent inset>
          <v-card class="text-center px-8 pt-2" height="300px">
            <v-card-title class="justify-center">Severity Override Justification</v-card-title>
            <v-card-subtitle v-if="selectedRule.severityJustification === ''" class="justify-center mt-1">
              <strong>Please input a valid severity override justification.</strong>
            </v-card-subtitle>
            <v-card-subtitle v-else class="justify-center mt-1">
              <strong>Press "OK" to save.</strong>
            </v-card-subtitle>
            <v-textarea class="mt-2" v-model="selectedRule.severityJustification" solo outlined dense no-resize
              height="130px" />
            <v-btn color="#616161" dark @click="cancelSeverityOverride">
              Cancel
            </v-btn>
            <v-btn class="ml-4" color="#616161" dark @click="validateSecurityJustification">
              Ok
            </v-btn>
          </v-card>
        </v-bottom-sheet>
      </div>
    </v-container>
  </template>
  </Base>
</template>

<script lang="ts">
import Base from './Base.vue';
import Component from 'vue-class-component';
import RouteMixin from '@/mixins/RouteMixin';
import { SearchModule } from '@/store/search';
import {
  ExtendedControlStatus,
  Filter,
  FilteredDataModule
} from '@/store/data_filters';
import {
  FileID,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import { capitalize } from 'lodash';
import { Severity } from 'inspecjs';
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
import { ChecklistVuln } from '../types/checklist/control';
import { InspecDataModule } from '@/store/data_store';
import _ from 'lodash';

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
  }
})
export default class Checklist extends RouteMixin {
  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;
  controlSelection: string | null = null;

  sheet = false;

  //** Variable for selected tab */
  tab = null;
  webOrDatabase = false; // Needs to be replaced for selected checklist

  selectedHeaders: { text: string; value: string; width: string }[] = [
    { text: 'Status', value: 'status', width: '100px' },
    { text: 'STIG ID', value: 'ruleVersion', width: '130px' },
    { text: 'Rule ID', value: 'ruleId', width: '160px' },
    { text: 'Vul ID', value: 'vulnNum', width: '100px' },
    { text: 'Group Name', value: 'groupTitle', width: '150px' },
    { text: 'CCIs', value: 'cciRef', width: '120px' }
  ];

  headersList = [
    { text: 'Status', value: 'status', width: '100px' },
    { text: 'STIG ID', value: 'ruleVersion', width: '130px' },
    { text: 'Rule ID', value: 'ruleId', width: '160px' },
    { text: 'Vul ID', value: 'vulnNum', width: '100px' },
    { text: 'Group Name', value: 'groupTitle', width: '150px' },
    { text: 'CCIs', value: 'cciRef', width: '120px' }
  ];

  /** Kept so we can filter by these values even though they are hidden */
  hiddenRows = [
    { value: 'severity', align: ' d-none' },
    { value: 'ruleTitle', align: ' d-none' },
    { value: 'vulnDiscuss', align: ' d-none' },
    { value: 'iaControls', align: ' d-none' },
    { value: 'checkContent', align: ' d-none' },
    { value: 'fixText', align: ' d-none' },
    { value: 'falsePositives', align: ' d-none' },
    { value: 'falseNegatives', align: ' d-none' },
    { value: 'documentable', align: ' d-none' },
    { value: 'mitigations', align: ' d-none' },
    { value: 'potentialImpact', align: ' d-none' },
    { value: 'thirdPartyTools', align: ' d-none' },
    { value: 'mitigationControl', align: ' d-none' },
    { value: 'responsibility', align: ' d-none' },
    { value: 'securityOverrideGuidance', align: ' d-none' },
    { value: 'checkContentRef', align: ' d-none' },
    { value: 'weight', align: ' d-none' },
    { value: 'class', align: ' d-none' },
    { value: 'stigRef', align: ' d-none' },
    { value: 'targetKey', align: ' d-none' },
    { value: 'stigUuid', align: ' d-none' },
    { value: 'legacyId', align: ' d-none' }
  ];

  techAreaLabels: string[] = [
    'Application Review',
    'Boundary Security',
    'CDS Admin Review',
    'CDS Technical Review',
    'Database Review',
    'Domain Name System (DNS)',
    'Exchange Server',
    'Host Based System Security (HBSS)',
    'Internal Network',
    'Mobility',
    'Releasable Networks (REL)',
    'Traditional Security',
    'UNIX OS',
    'VVOIP Review',
    'Web Review',
    'Windows OS',
    'Other Review'
  ];

  /** List of switches for each control Status */
  controlStatusSwitches = [
    { name: 'Passed', value: 'NotAFinding', enabled: true, color: 'statusPassed' },
    { name: 'Failed', value: 'Open', enabled: true, color: 'statusFailed' },
    { name: 'Not Applicable', value: 'Not_Applicable', enabled: true, color: 'statusNotApplicable' },
    { name: 'Not Reviewed', value: 'Not_Reviewed', enabled: true, color: 'statusNotReviewed' }
  ];

  /** List of switches for each severity (includes Short ID) */
  severitySwitches = [
    { name: 'High', value: 'high', enabled: true, color: 'teal' },
    { name: 'Medium', value: 'medium', enabled: true, color: 'teal' },
    { name: 'Low', value: 'low', enabled: true, color: 'teal' },
    { name: 'Short ID', value: 'Short ID', enabled: true, color: 'teal' }
  ];

  statusItems = [
    { name: 'Passed', value: 'NotAFinding' },
    { name: 'Failed', value: 'Open' },
    { name: 'Not Applicable', value: 'Not_Applicable' },
    { name: 'Not Reviewed', value: 'Not_Reviewed', }
  ]
  severityOverrideItems = [
    { name: 'High', value: 'CAT I' },
    { name: 'Medium', value: 'CAT II' },
    { name: 'Low', value: 'CAT III' },
    { name: 'None', value: '' }
  ]

  evalInfo:
    | SourcedContextualizedEvaluation
    | SourcedContextualizedProfile
    | null = null;

  truncate(value: string, length: number, omission = '...') {
    return _.truncate(value, { omission: omission, length: length });
  }

  shortStatus(status: string) {
    if (this.severitySwitches.find(item => item.name === 'Short ID')?.enabled) {
      switch (status) {
        case 'Not Reviewed':
          return 'NR'
        case 'Failed':
          return 'F'
        case 'Passed':
          return 'P'
        case 'Not Applicable':
          return 'NA'
      }
    }
    return status
  }

  shortRuleId(ruleId: string) {
    if (this.severitySwitches.find(item => item.name === 'Short ID')?.enabled) return ruleId.split('r')[0] || ruleId;
    else return ruleId;
  }

  shortStigId(stigId: string) {
    if (this.severitySwitches.find(item => item.name === 'Short ID')?.enabled) return stigId.split('-').slice(0, 2).join('-');
    else return stigId;
  }

  mapStatus(status: string) {
    switch (status) {
      // Mapping from checklist to Heimdall's conventions
      case 'Not_Reviewed':
        return 'Not Reviewed';
      case 'Open':
        return 'Failed';
      case 'NotAFinding':
        return 'Passed';
      case 'Not_Applicable':
        return 'Not Applicable';

      //Mapping from Heimdall's conventions back to checklist
      case 'Not Reviewed':
        return 'Not_Reviewed';
      case 'Failed':
        return 'Open';
      case 'Passed':
        return 'NotAFinding';
      case 'Not Applicable':
        return 'Not_Applicable';
      default:
        return status;
    }
  }
  mapSeverity(severity: string) {
    switch (severity) {
      case 'high':
        return 'CAT I'
      case 'medium':
        return 'CAT II'
      case 'low':
        return 'CAT III'
      default:
        return ''
    }
  }


  numStatus(status: string): string {
    return this.tableItems
      .filter((item) => item.status === status)
      .length.toString();
  }

  numSeverity(severity: string): string {
    if (severity === 'Short ID') return '';
    return this.tableItems
      .filter((item) => item.severity === severity.toLowerCase())
      .length.toString();
  }

  checkSelected(rule: ChecklistVuln) {
    if (rule.ruleId === FilteredDataModule.selectedRule.ruleId)
      return 'selectedRow';
  }

  get selectedRule() {
    return FilteredDataModule.selectedRule;
  }

  get selectedChecklistAsset() {
    const selectedChecklist = this.getChecklist(this.file_filter)
    if (selectedChecklist) {
      return selectedChecklist.asset
    } else {
      return FilteredDataModule.emptyAsset
    }
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
    return FilteredDataModule.selectedChecklistIds;
  }

  getChecklist(fileID: FileID[]) {
    return InspecDataModule.allChecklistFiles.find(
      (f) => f.uniqueId === fileID[0]
    );
  }

  tableItems: ChecklistVuln[] = [];
  numItems = 0;
  getFiltered(rules: ChecklistVuln[]) {
    this.tableItems = rules;
    this.numItems = this.tableItems.length;
  }

  checkPossibleOverrides(severity: string) {
    return this.severityOverrideItems.filter(item => item.value !== this.mapSeverity(severity))
  }
  promptSeverityJustification() {
    this.selectedRule.severityJustification = '';
    this.sheet = true;
  }
  validJustification = true;
  validateSecurityJustification() {
    if (this.selectedRule.severityJustification !== '') {
      this.validJustification = true;
      this.sheet = false;
      return true;
    } else {
      this.validJustification = false;
      this.sheet = true;
      return false;
    }
  }
  cancelSeverityOverride() {
    this.validJustification = true;
    this.sheet = false;
    this.selectedRule.severityOverride = '';
    this.selectedRule.severityJustification = '';
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
    return FilteredDataModule.selectedChecklistIds.length === 0;
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
    FilteredDataModule.selectRule(rule);
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

  loadedRules: ChecklistVuln[] = [];
  get rules() {
    const rulesList: ChecklistVuln[] = [];
    this.getChecklist(this.file_filter)
      ?.stigs.map((stig) => stig.vulns)
      .forEach((rulesItems) => {
        rulesList.push(...rulesItems);
      });

    this.loadedRules = rulesList;

    const passed = this.controlStatusSwitches.find(
      (item) => item.name === 'Passed'
    )?.enabled;
    const failed = this.controlStatusSwitches.find(
      (item) => item.name === 'Failed'
    )?.enabled;
    const notApplicable = this.controlStatusSwitches.find(
      (item) => item.name === 'Not Applicable'
    )?.enabled;
    const notReviewed = this.controlStatusSwitches.find(
      (item) => item.name === 'Not Reviewed'
    )?.enabled;

    const high = this.severitySwitches.find(
      (item) => item.name === 'High'
    )?.enabled;
    const medium = this.severitySwitches.find(
      (item) => item.name === 'Medium'
    )?.enabled;
    const low = this.severitySwitches.find(
      (item) => item.name === 'Low'
    )?.enabled;

    const filteredRulesList = rulesList.filter((rule) => {
      const includedStatuses: string[] = [];
      if (passed) {
        includedStatuses.push('NotAFinding');
      }
      if (failed) {
        includedStatuses.push('Open');
      }
      if (notApplicable) {
        includedStatuses.push('Not_Applicable');
      }
      if (notReviewed) {
        includedStatuses.push('Not_Reviewed');
      }

      const includedSeverities: string[] = [];
      if (high) {
        includedSeverities.push('high');
      }
      if (medium) {
        includedSeverities.push('medium');
      }
      if (low) {
        includedSeverities.push('low');
      }

      if (
        includedStatuses.includes(rule.status) &&
        (includedSeverities.includes(rule.severity) ||
          includedSeverities.includes(rule.severityOverride))
      ) {
        return true;
      }
      return false;
    });
    if (filteredRulesList.length === 0) {
      FilteredDataModule.selectRule(FilteredDataModule.emptyRule);
    } else {
      if (!filteredRulesList.includes(FilteredDataModule.selectedRule)) {
        FilteredDataModule.selectRule(filteredRulesList[0]);
      }
    }
    return filteredRulesList;
  }

  /**
   * The title to override with
   */
  get curr_title(): string {
    let returnText = `${capitalize(this.current_route_name)} View`;
    if (this.file_filter.length === 1) {
      const file = this.getChecklist(this.file_filter);
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
}
</script>

<style>
tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.1);
}

.selectedRow {
  background-color: #616161 !important;
}
</style>
