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
              <v-tooltip top>
                <template #activator="{on}">
                  <IconLinkItem
                    key="exportCkl"
                    text="Export as CKL"
                    icon="mdi-check-all"
                    @click="exportCkl()"
                    v-on="on"
                  />
                </template>
                <span>JSON Download</span>
              </v-tooltip>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </template>
    <template #main-content>
      <v-container fluid grid-list-md pt-0 mt-4 mx-1>
        <v-row>
          <v-col md="4" :cols="12" class="pr-0 pl-1">
            <!-- Data Table -->
            <ChecklistRulesTable
              :all-filter="allFilter"
              :file-filter="fileFilter"
              :short-id-enabled="shortIdEnabled"
              :rules="rules"
              @toggle-short-id="shortIdEnabled = !shortIdEnabled"
            />
          </v-col>
          <!-- Rule Data -->
          <v-col md="8" :cols="12">
            <!-- Rule Header Info -->
            <ChecklistRuleInfoHeader
              :selected-rule="selectedRule"
              :short-id-enabled="shortIdEnabled"
            />
            <!-- Rule Body Info -->
            <ChecklistRuleInfoBody :selected-rule="selectedRule" />
            <!-- Rule Info Edit -->
            <ChecklistRuleEdit
              :selected-rule="selectedRule"
              :sheet="sheet"
              @enable-sheet="sheet = true"
            />
          </v-col>
        </v-row>
        <div class="text-center">
          <v-bottom-sheet v-model="sheet" persistent inset>
            <!-- Severity Override Justification -->
            <ChecklistSeverityOverride
              :selected-rule="selectedRule"
              :sheet="sheet"
              @disable-sheet="sheet = false"
              @enable-sheet="sheet = true"
            />
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
import UploadButton from '@/components/generic/UploadButton.vue';
import {ChecklistConverter, ChecklistVuln} from '@mitre/hdf-converters';
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

@Component({
  components: {
    Base,
    UploadButton,
    IconLinkItem,
    ChecklistRulesTable,
    ChecklistRuleInfoHeader,
    ChecklistRuleInfoBody,
    ChecklistRuleEdit,
    ChecklistSeverityOverride
  }
})
export default class Checklist extends RouteMixin {
  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;
  controlSelection: string | null = null;

  /** State variable to track status of bottom-sheet */
  sheet = false;

  /** State variable to track "Short ID" switch */
  shortIdEnabled = true;

  //** Variable for selected tab */
  tab = null;

  evalInfo:
    | SourcedContextualizedEvaluation
    | SourcedContextualizedProfile
    | null = null;

  exportCkl() {
    type FileData = {
      filename: string;
      data: string;
    };
    const checklist = this.getChecklist(this.fileFilter);
    if (checklist) {
      const checklistString = ChecklistConverter.toChecklist(checklist);
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
    let stillExists = false;
    // Checks to see if the selected rule still exists after filtering
    this.rules.forEach((item) => {
      if (_.isEqual(FilteredDataModule.selectedRule, item)) {
        stillExists = true;
      }
    });
    if (stillExists) {
      return FilteredDataModule.selectedRule;
    }
    return this.rules[0] ?? FilteredDataModule.emptyRule;
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
  get fileFilter(): FileID[] {
    return FilteredDataModule.selectedChecklistIds;
  }

  getChecklist(fileID: FileID[]) {
    return InspecDataModule.allChecklistFiles.find(
      (f) => f.uniqueId === fileID[0]
    );
  }

  /**
   * The filter for charts. Contains all of our filter stuff
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
      control_id: this.controlSelection || undefined,
      iaControlsSearchTerms: SearchModule.inFileSearchTerms.iaControls,
      keywordsSearchTerms: SearchModule.inFileSearchTerms.keywords
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
      this.searchTerm
    ) {
      result = true;
    } else {
      result = false;
    }

    // Logic to check: are any files actually visible?
    if (this.rules.length === 0) {
      this.filterSnackbar = true;
    } else {
      this.filterSnackbar = false;
    }

    // Finally, return our result
    return result;
  }

  get rules() {
    const rulesList: ChecklistVuln[] = [];
    this.getChecklist(this.fileFilter)
      ?.stigs.map((stig) => stig.vulns)
      .forEach((rulesItems) => {
        rulesList.push(...rulesItems);
      });

    return checklistRules(rulesList, this.allFilter);
  }

  /**
   * The title to override with
   */
  get currentTitle(): string {
    if (this.fileFilter.length !== 0) {
      const file = this.getChecklist(this.fileFilter);
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
