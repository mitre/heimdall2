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
            />
          </v-col>
          <!-- Rule Data -->
          <v-col md="8" :cols="12">
            <v-card height="13vh" class="overflow-y-auto">
              <v-card-text class="text-center">
                <h3
                  class="d-inline-block text-truncate mx-2"
                  style="max-width: 100%"
                >
                  {{ selectedRule.stigRef }}
                </h3>
                <v-row dense class="mt-n2 mt-xl-3">
                  <v-col :cols="4">
                    <div>
                      <span class="text-overline white--text">Vul ID: </span>
                      {{ selectedRule.vulnNum }}
                    </div>
                  </v-col>
                  <v-col :cols="4">
                    <div>
                      <span class="text-overline white--text">Rule ID: </span>
                      {{ shortRuleId(selectedRule.ruleId) }}
                    </div>
                  </v-col>
                  <v-col :cols="4">
                    <div>
                      <span class="text-overline white--text">STIG ID: </span>
                      {{ shortStigId(selectedRule.ruleVersion) }}
                    </div>
                  </v-col>
                </v-row>
                <v-row dense class="mt-n2 mt-xl-2">
                  <v-col :cols="4">
                    <div>
                      <span class="text-overline white--text">Severity: </span
                      >{{ selectedRule.severity }}
                    </div>
                  </v-col>
                  <v-col :cols="4">
                    <div>
                      <span class="text-overline white--text">
                        Classification:
                      </span>
                      {{ selectedRule.class }}
                    </div>
                  </v-col>
                  <v-col :cols="4">
                    <div>
                      <span class="text-overline white--text">Legacy IDs: </span
                      >{{ selectedRule.legacyId }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
            <v-card height="37vh" class="overflow-auto mt-3 pt-2">
              <div v-if="selectedRule.ruleId !== ''">
                <v-card-text>
                  <div>
                    <span class="text-overline white--text">Rule Title: </span>
                  </div>
                  {{ selectedRule.ruleTitle }}<br /><br />
                  <div>
                    <span class="text-overline white--text">Discussion: </span>
                  </div>
                  {{ selectedRule.vulnDiscuss }}<br /><br />
                  <div>
                    <span class="text-overline white--text">Check Text: </span>
                  </div>
                  {{ selectedRule.checkContent }}<br /><br />
                  <div>
                    <span class="text-overline white--text">Fix Text: </span>
                  </div>
                  {{ selectedRule.fixText }}<br /><br />
                </v-card-text>
                <v-card-subtitle class="text-center text-subtitle-2">
                  References
                </v-card-subtitle>
                <v-divider />
                <v-card-text>
                  <div
                    v-for="item in selectedRule.cciRef.split('; ')"
                    :key="item"
                  >
                    {{ item }}: {{ cciDescription(item) }}
                    <div>
                      NIST 800-53 Rev 4:
                      <v-chip small>{{ nistTag(item)[2] || 'None' }}</v-chip>
                    </div>
                    <br />
                  </div>
                  <br /><br />
                </v-card-text>
              </div>
              <div v-else>
                <v-card-text>No rule selected.</v-card-text>
              </div>
            </v-card>
            <v-card class="mt-3 pt-4" height="42vh">
              <v-card-text>
                <v-row>
                  <v-col>
                    <v-select
                      v-model="selectedRule.status"
                      dense
                      label="Status"
                      :items="statusItems"
                      item-text="name"
                      item-value="value"
                      :item-color="statusColor(selectedRule.status)"
                    />
                  </v-col>
                  <v-col>
                    <v-select
                      v-model="selectedRule.severityOverride"
                      dense
                      label="Severity Override"
                      item-text="name"
                      item-value="value"
                      :items="checkPossibleOverrides(selectedRule.severity)"
                      @change="promptSeverityJustification"
                    />
                  </v-col>
                </v-row>
                <v-row class="mt-n8">
                  <v-col>
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
                <v-row class="mt-n10">
                  <v-col>
                    <strong>Comments: </strong>
                    <v-textarea
                      v-model="selectedRule.comments"
                      solo
                      outlined
                      dense
                      no-resize
                      height="8vh"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <div class="text-center">
          <v-bottom-sheet v-model="sheet" persistent inset>
            <v-card class="text-center px-8 pt-2" height="300px">
              <v-card-title class="justify-center"
                >Severity Override Justification</v-card-title
              >
              <v-card-subtitle
                v-if="selectedRule.severityJustification === ''"
                class="justify-center mt-1"
              >
                <strong>
                  Please input a valid severity override justification.
                  (Required)
                </strong>
              </v-card-subtitle>
              <v-card-subtitle v-else class="justify-center mt-1">
                <strong>Press "OK" to save.</strong>
              </v-card-subtitle>
              <v-textarea
                v-model="selectedRule.severityJustification"
                class="mt-2"
                solo
                outlined
                dense
                no-resize
                height="130px"
              />
              <v-btn color="#616161" dark @click="cancelSeverityOverride">
                Cancel
              </v-btn>
              <v-btn
                class="ml-4"
                color="#616161"
                dark
                @click="validateSecurityJustification"
              >
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
import {CCI_DESCRIPTIONS} from '@/utilities/cci_util';
import {saveSingleOrMultipleFiles} from '@/utilities/export_util';
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {AppInfoModule} from '@/store/app_info';
import ChecklistRulesTable from '@/components/global/checklist/ChecklistRulesTable.vue';

@Component({
  components: {
    Base,
    UploadButton,
    IconLinkItem,
    ChecklistRulesTable
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

  statusItems = [
    {name: 'Passed', value: 'Passed'},
    {name: 'Failed', value: 'Failed'},
    {name: 'Not Applicable', value: 'Not Applicable'},
    {name: 'Not Reviewed', value: 'Not Reviewed'}
  ];

  severityOverrideItems = [
    {name: 'High', value: 'high'},
    {name: 'Medium', value: 'medium'},
    {name: 'Low', value: 'low'},
    {name: '(Default)', value: ''}
  ];

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

  statusColor(status: string) {
    switch (status) {
      case 'Passed':
        return 'statusPassed';
      case 'Not Applicable':
        return 'statusNotApplicable';
      case 'Failed':
        return 'statusFailed';
      default: // Not_Reviewed
        return 'statusNotReviewed';
    }
  }

  shortRuleId(ruleId: string) {
    if (this.shortIdEnabled) return ruleId.split('r')[0] || ruleId;
    else return ruleId;
  }

  shortStigId(stigId: string) {
    if (this.shortIdEnabled) return stigId.split('-').slice(0, 2).join('-');
    else return stigId;
  }

  nistTag(cci: string): string[] {
    return CCI_DESCRIPTIONS[cci].nist;
  }

  cciDescription(cci: string): string {
    return CCI_DESCRIPTIONS[cci].def;
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

  checkPossibleOverrides(severity: string) {
    return this.severityOverrideItems.filter((item) => item.value !== severity);
  }

  promptSeverityJustification() {
    if (this.selectedRule.severityOverride === '') {
      this.selectedRule.severityJustification =
        'Returning to default severity.';
    } else {
      this.selectedRule.severityJustification = '';
    }
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
