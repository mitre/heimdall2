<template>
  <Base
    :show-search="true"
    :title="currentTitle"
    @changed-files="evalInfo = null"
  >
    <!-- Topbar content - give it a search bar -->
    <template #topbar-content>
      <v-btn :disabled="!canClear" @click="clear">
        <span class="d-none d-md-inline pr-2"> Clear </span>
        <v-icon>mdi-filter-remove</v-icon>
      </v-btn>
      <UploadButton />
      <ExportButton>
        <v-list-item class="px-0">
          <ExportCaat :filter="allFilter" />
        </v-list-item>
        <v-list-item class="px-0">
          <ExportNist :filter="allFilter" />
        </v-list-item>
        <v-list-item class="px-0">
          <ExportASFFModal :filter="allFilter" />
        </v-list-item>
        <v-list-item class="px-0">
          <ExportCKLModal :filter="allFilter" />
        </v-list-item>
        <v-list-item class="px-0">
          <ExportCSVModal :filter="allFilter" />
        </v-list-item>
      </ExportButton>
    </template>
    <template #main-content>
      <v-container fluid grid-list-md pt-0 mt-4 mx-1>
        <v-row>
          <!-- Left Panel -->
          <v-col cols="12" md="6">
            <!-- Data Table -->
            <v-row dense>
              <ChecklistRulesTable
                :all-filter="allFilter"
                :file-filter="fileFilter"
                :short-id-enabled="shortIdEnabled"
                :rules="filteredRules"
                :num-total-rules="allRules.length"
                @toggle-short-id="shortIdEnabled = !shortIdEnabled"
              />
            </v-row>
          </v-col>
          <!-- Right Panel (Rule Data) -->
          <v-col id="right-panel" ref="rightPanel" cols="12" md="6">
            <!-- Rule Header Info -->
            <v-row dense>
              <ChecklistRuleInfoHeader
                :selected-rule="selectedRule"
                :short-id-enabled="shortIdEnabled"
              />
            </v-row>
            <!-- Rule Body Info -->
            <v-row dense>
              <ChecklistRuleInfoBody
                :selected-rule="selectedRule"
                @enable-sheet="sheet = true"
              />
            </v-row>
            <!-- Rule Info Edit -->
            <v-row dense>
              <ChecklistRuleEdit
                :selected-rule="selectedRule"
                :sheet="sheet"
                @enable-sheet="sheet = true"
                @update-override="setSeverityOverrideSelection"
              />
            </v-row>
          </v-col>
        </v-row>
        <div class="text-center">
          <v-bottom-sheet v-model="sheet" persistent inset>
            <!-- Severity Override Justification -->
            <ChecklistSeverityOverride
              :selected-rule="selectedRule"
              :sheet="sheet"
              :severityoverride-selection="severityOverrideSelection"
              @disable-sheet="sheet = false"
              @enable-sheet="sheet = true"
            />
          </v-bottom-sheet>
        </div>
      </v-container>
    </template>
    <!-- Everything-is-filtered snackbar -->
    <v-snackbar
      v-model="enableChecklistSnackbar"
      class="mt-11"
      style="z-index: 2"
      :timeout="-1"
      color="warning"
      top
    >
      <span v-if="fileFilter.length" class="subtitle-2">
        All results are filtered out. Use the
        <v-icon>mdi-filter-remove</v-icon> button in the top right to clear
        filters and show all.
      </span>
      <span v-else-if="noFiles" class="subtitle-2">
        No files are currently loaded. Press the <strong>LOAD</strong>
        <v-icon class="mx-1"> mdi-cloud-upload</v-icon> button above to load
        some.
      </span>
      <span v-else-if="fileFilter === ''" class="subtitle-2">
        No files are currently enabled for viewing. Open the
        <v-icon class="mx-1">mdi-arrow-right</v-icon> sidebar menu, and ensure
        that the file you wish to view is
        <v-icon class="mx-1">mdi-radiobox-marked</v-icon> selected.
      </span>
    </v-snackbar>
  </Base>
</template>

<script lang="ts">
import Base from './Base.vue';
import Component from 'vue-class-component';
import RouteMixin from '@/mixins/RouteMixin';
import {SearchModule} from '@/store/search';
import {
  ChecklistFilter,
  FilteredDataModule,
  checklistRules
} from '@/store/data_filters';
import {
  FileID,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import ExportCKLModal from '@/components/global/ExportCKLModal.vue';
import ExportASFFModal from '@/components/global/ExportASFFModal.vue';
import ExportCaat from '@/components/global/ExportCaat.vue';
import ExportCSVModal from '@/components/global/ExportCSVModal.vue';
import ExportNist from '@/components/global/ExportNist.vue';
import UploadButton from '@/components/generic/UploadButton.vue';
import {ChecklistVuln, Severity} from '@mitre/hdf-converters';
import {InspecDataModule} from '@/store/data_store';
import _ from 'lodash';
import {saveSingleOrMultipleFiles} from '@/utilities/export_util';
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {AppInfoModule} from '@/store/app_info';
import ChecklistRulesTable from '@/components/global/checklist/ChecklistRulesTable.vue';
import ChecklistRuleInfoHeader from '@/components/global/checklist/ChecklistRuleInfoHeader.vue';
import ChecklistRuleInfoBody from '@/components/global/checklist/ChecklistRuleInfoBody.vue';
import ChecklistRuleEdit from '@/components/global/checklist/ChecklistRuleEdit.vue';
import ChecklistSeverityOverride from '@/components/global/checklist/ChecklistSeverityOverride.vue';
import ExportButton from '@/components/generic/ExportButton.vue';

@Component({
  components: {
    Base,
    UploadButton,
    IconLinkItem,
    ExportASFFModal,
    ExportCKLModal,
    ExportCSVModal,
    ExportNist,
    ExportCaat,
    ChecklistRulesTable,
    ChecklistRuleInfoHeader,
    ChecklistRuleInfoBody,
    ChecklistRuleEdit,
    ChecklistSeverityOverride,
    ExportButton
  }
})
export default class Checklist extends RouteMixin {
  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;

  /** State variable to track status of bottom-sheet */
  sheet = false;

  /** State variable to track severity justification */
  newJustification = this.selectedRule.severityjustification;

  /** State variable to track severity override */
  severityOverrideSelection = this.selectedRule.severityoverride ?? '';

  setSeverityOverrideSelection(value: Severity) {
    this.severityOverrideSelection = value;
  }

  /** State variable to track "Short ID" switch */
  shortIdEnabled = true;

  evalInfo:
    | SourcedContextualizedEvaluation
    | SourcedContextualizedProfile
    | null = null;

  exportCkl() {
    type FileData = {
      filename: string;
      data: string;
    };
    const checklist = InspecDataModule.getChecklist(this.fileFilter);
    if (checklist) {
      const checklistString = 'NEEDS FIXING';
      //const checklistString = ChecklistConverter.toChecklist(checklist);
      const file: FileData[] = [
        {
          filename: checklist.filename,
          data: '<?xml version="1.0" encoding="UTF-8"?>' + checklistString
        }
      ];
      saveSingleOrMultipleFiles(file, 'ckl');
    }
  }

  get selectedRule() {
    if (
      this.filteredRules.some((rule) =>
        _.isEqual(FilteredDataModule.selectedRule, rule)
      )
    ) {
      return FilteredDataModule.selectedRule;
    }
    return this.filteredRules[0] ?? FilteredDataModule.emptyRule;
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

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get fileFilter(): FileID {
    return FilteredDataModule.selectedChecklistId;
  }

  /**
   * Returns true if no checklist files are loaded
   */
  get noFiles(): boolean {
    return InspecDataModule.allChecklistFiles.length == 0;
  }

  /**
   * Subset of all filter terms specific for Results
   */
  get allFilter(): ChecklistFilter {
    return {
      status: SearchModule.inFileSearchTerms.statusFilter,
      severity: SearchModule.inFileSearchTerms.severityFilter,
      fromFile: this.fileFilter,
      ruleidSearchTerms: SearchModule.inFileSearchTerms.ruleid,
      vulidSearchTerms: SearchModule.inFileSearchTerms.vulid,
      stigidSearchTerms: SearchModule.inFileSearchTerms.stigid,
      classificationSearchTerms: SearchModule.inFileSearchTerms.classification,
      groupNameSearchTerms: SearchModule.inFileSearchTerms.groupName,
      cciSearchTerms: SearchModule.inFileSearchTerms.cci,
      titleSearchTerms: SearchModule.inFileSearchTerms.title,
      descriptionSearchTerms: SearchModule.inFileSearchTerms.description,
      nistIdFilter: SearchModule.inFileSearchTerms.NISTIdFilter,
      codeSearchTerms: SearchModule.inFileSearchTerms.code,
      omit_overlayed_controls: true,
      iaControlsSearchTerms: SearchModule.inFileSearchTerms.iacontrols,
      keywordsSearchTerms: SearchModule.inFileSearchTerms.keywords
    };
  }

  /**
   * Clear all filters
   */
  clear(clearSearchBar = false) {
    SearchModule.clear();
    if (clearSearchBar) {
      this.searchTerm = '';
    }
  }

  get enableChecklistSnackbar(): boolean {
    if (
      this.filteredRules.length === 0 ||
      FilteredDataModule.selectedChecklistId === ''
    ) {
      return true;
    } else {
      return false;
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
      SearchModule.inFileSearchTerms.code.length !== 0 ||
      this.searchTerm
    ) {
      result = true;
    } else {
      result = false;
    }

    // Finally, return our result
    return result;
  }

  get allRules() {
    let rulesList: ChecklistVuln[] = [];
    for (const stig of InspecDataModule.getChecklist(this.fileFilter)?.stigs ??
      []) {
      rulesList = [...rulesList, ...stig.vulns];
    }
    return rulesList;
  }

  get filteredRules() {
    return checklistRules(this.allRules, this.allFilter);
  }

  /**
   * The title to override with
   */
  get currentTitle(): string {
    if (this.fileFilter.length !== 0) {
      const file = InspecDataModule.getChecklist(this.fileFilter);
      if (file) {
        return `Checklist View (${file.filename} selected)`;
      }
    }
    return `Checklist View (0 Checklists selected)`;
  }

  get currentView(): string {
    return AppInfoModule.currentView;
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

.v-list .v-list-item--link:before {
  background-color: #3e3e3e;
}

.v-list .v-list-item:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
