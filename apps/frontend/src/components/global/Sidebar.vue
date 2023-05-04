<template>
  <div>
    <ChecklistTargetDataModal
      :visible="showTargetModal"
      @close-modal="showTargetModal = false"
    />
    <ChecklistTechnologyAreaModal
      :visible="showTechnologyModal"
      @close-modal="showTechnologyModal = false"
    />

    <!-- Due to how the vuetify components work, one drawer is permanent to always be appended to the side and the other will be the temporary that can be pulled out -->
    <v-navigation-drawer
      :clipped="$vuetify.breakpoint.lgAndUp"
      app
      :style="{'z-index': 11}"
      permanent
      width="45px"
      @input="$emit('input', $event)"
    >
      <v-container
        v-if="!isUtilityDrawerShown"
        fill-height
        fluid
        @click="isUtilityDrawerShown = !isUtilityDrawerShown"
      >
        <v-row align="center" justify="center">
          <v-col>
            <v-icon>mdi-arrow-right</v-icon>
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>
    <v-navigation-drawer
      v-model="isUtilityDrawerShown"
      :clipped="$vuetify.breakpoint.lgAndUp"
      app
      :style="{'z-index': 11, 'margin-top': classification ? '5em' : '3em'}"
      temporary
      width="600px"
      @input="$emit('input', $event)"
    >
      <div v-if="isUtilityDrawerShown">
        <v-expansion-panels v-model="active_path" accordion>
          <DropdownContent
            header-text="Results"
            :files="visible_evaluation_files"
            :all-selected="all_evaluations_selected"
            :enable-compare-view="true"
            :compare-view-active="compareViewActive"
            @toggle-all="toggle_all_evaluations"
            @toggle-compare-view="compareView"
            @changed-files="$emit('changed-files')"
          />
          <DropdownContent
            header-text="Profiles"
            :files="visible_profile_files"
            :all-selected="all_profiles_selected"
            @toggle-all="toggle_all_profiles"
            @changed-files="$emit('changed-files')"
          />
          <DropdownContent
            header-text="Checklists"
            :files="visible_checklist_files"
            @changed-files="$emit('changed-files')"
          />
        </v-expansion-panels>
        <div class="mx-5 mr-10 mb-5">
          <!-- Checklist Data Modals -->
          <v-row v-if="inChecklistView" class="my-4">
            <v-btn
              id="target-data-btn"
              class="mx-2"
              @click="setShowTargetModal"
            >
              <span class="d-none d-md-inline pr-2">
                Add/Update Target Data
              </span>
            </v-btn>
            <v-btn
              id="technology-area-btn"
              class="mx-2"
              @click="setShowTechnologyModal"
            >
              <span class="d-none d-md-inline pr-2">
                Add/Update Technology Area
              </span>
            </v-btn>
          </v-row>
          <!-- Quick Filters -->
          <h1 class="my-4">Quick Filters:</h1>
          <v-row class="my-4">
            <v-col
              v-for="item in controlStatusSwitches"
              :key="item.name"
              :cols="3"
            >
              {{ item.name }}
            </v-col>
          </v-row>
          <v-row class="mt-n10">
            <v-col
              v-for="item in controlStatusSwitches"
              :key="item.name"
              :cols="3"
            >
              <v-switch
                dense
                inset
                :color="item.color"
                :input-value="item.enabled"
                @change="changeStatusToggle(item.name)"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col v-for="item in severitySwitches" :key="item.name" :cols="3">
              {{ item.name }}
            </v-col>
          </v-row>
          <v-row class="mt-n10">
            <v-col v-for="item in severitySwitches" :key="item.name" :cols="3">
              <v-switch
                dense
                inset
                :color="item.color"
                :input-value="item.enabled"
                @change="changeSeverityToggle(item.name)"
              />
            </v-col>
          </v-row>
          <v-divider class="my-5" />
          <!-- Category Filters -->
          <h1 class="mt-5">Category Filters:</h1>
          <v-row class="mt-4">
            <v-select
              v-model="currentFreeTextFilterCategory"
              class="mx-2 select"
              :items="categories"
              label="Filter Categories"
            />
            <v-text-field
              v-model="currentFreeTextFilterInput"
              class="mr-2"
              label="Enter filter keyword"
            />
            <v-btn
              class="mx-2"
              @click="
                addCategoryFilter(
                  currentFreeTextFilterCategory,
                  currentFreeTextFilterInput
                )
              "
            >
              <span class="d-none d-md-inline">Add</span>
            </v-btn>
          </v-row>
          <v-row
            style="align-items: center; justify-content: center"
            class="mt-n5"
          >
            <v-radio-group v-model="selectedRadioButton" row>
              <v-radio label="Inclusive (+) Filter" value="inclusive" />
              <v-radio label="Exclusive (-) Filter" value="exclusive" />
            </v-radio-group>
          </v-row>
          <v-divider class="my-5" />
          <!-- Selected Filters -->
          <h1 class="my-4">Selected Filters:</h1>
          <v-row class="mt-4 mx-auto">
            <v-data-table
              v-model="selectedFilters"
              dense
              show-select
              :headers="filterHeaders"
              :items="convertFilterData(currentFilters.conditionArray)"
              item-key="value"
              class="elevation-1 mb-3"
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
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
import DropdownContent from '@/components/global/sidebaritems/DropdownContent.vue';
import {Trinary} from '@/enums/Trinary';
import RouteMixin from '@/mixins/RouteMixin';
import {ExtendedControlStatus, FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {ChecklistFile} from '@mitre/hdf-converters';
import Component, {mixins} from 'vue-class-component';
import {ServerModule} from '../../store/server';
import {SearchModule} from '@/store/search';
import {Severity} from 'inspecjs';
import ChecklistTargetDataModal from '@/components/global/ChecklistTargetDataModal.vue';
import ChecklistTechnologyAreaModal from '@/components/global/ChecklistTechnologyAreaModal.vue';
import {SearchFilterSyncModule} from '@/store/search_filter_sync';
import {AppInfoModule} from '@/store/app_info';

type FilterType = 'inclusive' | 'exclusive';

@Component({
  components: {
    DropdownContent,
    ChecklistTargetDataModal,
    ChecklistTechnologyAreaModal
  }
})
export default class Sidebar extends mixins(RouteMixin) {
  addCategoryFilter(field: string, value: string) {
    let negated = false;
    if (this.selectedRadioButton === 'exclusive') {
      negated = true;
    }
    SearchModule.addSearchFilter({
      field,
      value,
      negated
    });
  }

  /** Whether category filter is inclusive or exclusive (default: inclusive)*/
  selectedRadioButton: FilterType = 'inclusive';

  selectedFilters = [];
  /** Removes selected filters from data table */
  removeSelectedFilters() {
    this.selectedFilters.forEach(
      (item: {keyword: string; value: string; negated: string}) => {
        const field = item.keyword;
        const value = item.value;
        let negated = false;
        if (item.negated === '-') {
          negated = true;
        }
        SearchModule.removeSearchFilter({
          field,
          value,
          negated
        });
      }
    );
  }

  removeAllFilters() {
    SearchModule.clear();
    this.selectedFilters = [];
    SearchModule.updateSearch('');
  }

  /** Converts the active filters into array that can be ingested by selected filter data table */
  convertFilterData(
    filters: {keyword: string; value: string; negated: boolean}[]
  ) {
    let temp: {keyword: string; value: string; negated: string}[] = [];
    filters.forEach(
      (item: {keyword: string; value: string; negated: boolean}) => {
        if (item.negated) {
          temp.push({keyword: item.keyword, value: item.value, negated: '-'});
        } else {
          temp.push({keyword: item.keyword, value: item.value, negated: '+'});
        }
      }
    );
    return temp;
  }

  get controlStatusSwitches(): {
    name: string;
    value: ExtendedControlStatus;
    enabled: boolean;
    color: string;
  }[] {
    return FilteredDataModule.controlStatusSwitches;
  }

  get severitySwitches(): {
    name: string;
    value: Severity;
    enabled: boolean;
    color: string;
  }[] {
    return FilteredDataModule.severitySwitches;
  }

  changeSeverityToggle(name: Severity) {
    SearchFilterSyncModule.changeSeveritySwitch(name);
  }

  changeStatusToggle(name: ExtendedControlStatus) {
    SearchFilterSyncModule.changeStatusSwitch(name);
  }

  // Used for toggling the side nav drawer
  isUtilityDrawerShown = false;
  setUtilityDrawerBoolean() {
    this.isUtilityDrawerShown = !this.isUtilityDrawerShown;
  }

  // Used for toggling the target data modal
  showTargetModal = false;
  setShowTargetModal() {
    this.showTargetModal = !this.showTargetModal;
  }

  // Used for toggling the technology area modal
  showTechnologyModal = false;
  setShowTechnologyModal() {
    this.showTechnologyModal = !this.showTechnologyModal;
  }

  currentFreeTextFilterInput = '';
  currentFreeTextFilterCategory = '';

  /** Free text filter category list for dropdown */
  readonly categories = [
    'Keywords',
    'ID',
    'Vul ID',
    'Rule ID',
    'Title',
    'Nist',
    'Description',
    'Code',
    'Stig ID',
    'Classification',
    'IA Control',
    'Group Name',
    'CCIs'
  ];

  /** Returns the current parsed search result */
  get currentFilters() {
    return SearchModule.parsedSearchResult;
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

  /** Checks to see if you are in checklist view */
  get inChecklistView(): boolean {
    return AppInfoModule.currentView === 'checklists';
  }

  // open the appropriate v-expansion-panel based on current route
  get active_path() {
    if (this.currentRoute === 'checklists') {
      return 2;
    } else if (this.currentRoute === 'profiles') {
      return 1;
    } else if (
      this.currentRoute === 'results' ||
      this.currentRoute === 'compare'
    ) {
      return 0;
    } else {
      return -1;
    }
  }

  set active_path(id: number) {
    // There are currently 3 available values that the v-modal can have,
    // 0 -> results view
    // 1 -> profile view
    // 2 -> checklists view
    if (id === 0) {
      this.navigateWithNoErrors(`/results`);
    } else if (id === 1) {
      this.navigateWithNoErrors(`/profiles`);
    } else if (id === 2) {
      this.navigateWithNoErrors(`/checklists`);
    }
  }

  // get all visible (uploaded) evaluation files
  get visible_evaluation_files(): EvaluationFile[] {
    const files = InspecDataModule.allEvaluationFiles;
    return files.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  // get all visible (uploaded) profile files
  get visible_profile_files(): ProfileFile[] {
    const files = InspecDataModule.allProfileFiles;
    return files.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  // get all visible (uploaded) checklist files
  get visible_checklist_files(): ChecklistFile[] {
    const files = InspecDataModule.allChecklistFiles;
    return files.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  get all_evaluations_selected(): Trinary {
    return FilteredDataModule.all_evaluations_selected;
  }

  get all_profiles_selected(): Trinary {
    return FilteredDataModule.all_profiles_selected;
  }

  get checklist_selected(): Trinary {
    return FilteredDataModule.checklist_selected;
  }

  get compareViewActive(): boolean {
    return this.currentRoute === 'compare';
  }

  get classification(): string {
    return ServerModule.classificationBannerText;
  }

  // toggle the "select all" for profiles
  toggle_all_profiles(): void {
    FilteredDataModule.toggle_all_profiles();
  }

  // toggle the "select all" for evaluations
  toggle_all_evaluations(): void {
    FilteredDataModule.toggle_all_evaluations();
  }

  // toggle between the comparison view and the results view
  compareView(): void {
    if (this.currentRoute === 'results') {
      this.navigateWithNoErrors('/compare');
    }
    if (this.currentRoute === 'compare') {
      this.navigateWithNoErrors('/results');
    }
  }
}
</script>

<style scoped>
nav.v-navigation-drawer {
  /* Need !important as a max-height derived from the footer being always
     visible is applied directly to element by vuetify */
  max-height: 100vh !important;
  /* z-index hides behind footer and topbar */
  z-index: 1;
}

.select {
  width: 70px;
  max-height: 60px;
  font-size: 15px;
}
</style>
