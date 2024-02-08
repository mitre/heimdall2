<template>
  <div>
    <div v-if="visible_checklist_files.length > 0">
      <ChecklistTargetDataModal
        :visible="showTargetModal"
        @close-modal="showTargetModal = false"
      />
      <ChecklistTechnologyAreaModal
        :visible="showTechnologyModal"
        @close-modal="showTechnologyModal = false"
      />
    </div>


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
        class="clickable"
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
        <v-expansion-panels v-model="active_path" default>
        <!-- <v-expansion-panels :value="active_path" default> -->
          <DropdownContent
            header-text="Results"
            :files="visible_evaluation_files"
            :all-selected="all_evaluations_selected"
            :any-selected="any_evaluation_selected"
            :enable-compare-view="true"
            :compare-view-active="compareViewActive"
            :active-path="active_path"
            @remove-selected="removeSelectedEvaluations"
            @toggle-all="toggle_all_evaluations"
            @toggle-compare-view="compareView"
            @changed-files="$emit('changed-files')"
          />
          <DropdownContent
            header-text="Profiles"
            :files="visible_profile_files"
            :all-selected="all_profiles_selected"
            :any-selected="any_profile_selected"
            :active-path="active_path"
            @remove-selected="removeSelectedProfiles"
            @toggle-all="toggle_all_profiles"
            @changed-files="$emit('changed-files')"
          />
          <DropdownContent
            header-text="Checklists"
            :files="visible_checklist_files"
            :active-path="active_path"
            @changed-files="$emit('changed-files')"
          />
        </v-expansion-panels>
        <div class="mx-5 mr-10 mb-5">
          <!-- Checklist Data Modals -->
          <v-row v-if="inChecklistView" class="my-4" justify="center">
            <v-col>
              <v-btn
                id="target-data-btn"
                class="mx-2"
                @click="setShowTargetModal"
              >
                <span> Add/Update Target Data </span>
              </v-btn>
            </v-col>
            <v-col>
              <v-btn
                id="technology-area-btn"
                class="mx-2"
                @click="setShowTechnologyModal"
              >
                <span> Add/Update Technology Area </span>
              </v-btn>
            </v-col>
          </v-row>
          <!-- Filtering Capabilities Section -->
          <QuickFilters />
          <v-divider class="my-5" />
          <DropdownFilters
            header="Category Filters"
            :properties="inFileFilterProps"
          />
          <v-divider class="my-5" />
          <DropdownFilters
            :header="fileFilterTypeName + ' Filters'"
            :properties="fileMetadataFilterProps"
          />
          <v-divider class="my-5" />
          <SelectedFilterTable />
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
import DropdownContent from '@/components/global/sidebaritems/DropdownContent.vue';
import {Trinary} from '@/enums/Trinary';
import RouteMixin from '@/mixins/RouteMixin';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import Component, {mixins} from 'vue-class-component';
import {ServerModule} from '../../store/server';
import {EvaluationModule} from '@/store/evaluations';
import ChecklistTargetDataModal from '@/components/global/ChecklistTargetDataModal.vue';
import ChecklistTechnologyAreaModal from '@/components/global/ChecklistTechnologyAreaModal.vue';
import {AppInfoModule} from '@/store/app_info';
import QuickFilters from './sidebaritems/QuickFilters.vue';
import DropdownFilters from './sidebaritems/DropdownFilters.vue';
import SelectedFilterTable from './sidebaritems/SelectedFilterTable.vue';
import {views} from '@/store/app_info';

@Component({
  components: {
    DropdownContent,
    ChecklistTargetDataModal,
    ChecklistTechnologyAreaModal,
    QuickFilters,
    DropdownFilters,
    SelectedFilterTable
  }
})
export default class Sidebar extends mixins(RouteMixin) {
  /** Category list for in-file filtering dropdown */
  readonly inFileFilterProps = [
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

  /** Category list for file metadata filtering dropdown */
  readonly fileMetadataFilterProps = ['File Name', 'Group', 'Tag'];

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

  /** Checks to see if you are in checklist view */
  get inChecklistView(): boolean {
    return AppInfoModule.currentView === views.Checklist;
  }

  // open the appropriate v-expansion-panel based on current route
  get active_path() {
    console.log(`this.currentRoute: ${this.currentRoute}`)
    console.log(`views.Checklist: ${(this.currentRoute === views.Checklist)}`)
    console.log(`views.Profile: ${(this.currentRoute === views.Profile)}`)
    console.log(`views.Result: ${(this.currentRoute === views.Result)}`)
    console.log(`views.Compare: ${(this.currentRoute === views.Compare)}`)

    if (this.currentRoute === views.Checklist) {
      return 2;
    } else if (this.currentRoute === views.Profile) {
      return 1;
    } else if (
      this.currentRoute === views.Result ||
      this.currentRoute === views.Compare
    ) {
      return 0;
    } else {
      return -1;
    }
  }

  get fileFilterTypeName(): string {
    switch (this.active_path) {
      case 0:
        return 'Result Set';
      case 1:
        return 'Profile';
      case 2:
        return 'Checklist';
      default:
        return 'File';
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
  get visible_checklist_files(): EvaluationFile[] {
    const files = InspecDataModule.allChecklistFiles;
    return files.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  get all_evaluations_selected(): Trinary {
    return FilteredDataModule.all_evaluations_selected;
  }

  get any_evaluation_selected(): boolean {
    return FilteredDataModule.any_evaluation_selected;
  }

  get all_profiles_selected(): Trinary {
    return FilteredDataModule.all_profiles_selected;
  }

  get any_profile_selected(): boolean {
    return FilteredDataModule.any_profile_selected;
  }

  get checklist_selected(): Trinary {
    return FilteredDataModule.checklist_selected;
  }

  get compareViewActive(): boolean {
    return this.currentRoute === views.Compare;
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
    if (this.currentRoute === views.Result) {
      this.navigateWithNoErrors('/compare');
    } else if (this.currentRoute === views.Compare) {
      this.navigateWithNoErrors('/results');
    }
  }

  removeSelectedEvaluations(): void {
    const selectedFiles = FilteredDataModule.selected_evaluation_ids;
    selectedFiles.forEach((fileId) => {
      EvaluationModule.removeEvaluation(fileId);
      InspecDataModule.removeFile(fileId);
      // Remove any database files that may have been in the URL
      // by calling the router and causing it to write the appropriate
      // route to the URL bar
      this.navigateWithNoErrors(`/${this.currentRoute}`);
    });
  }

  removeSelectedProfiles(): void {
    const selectedFiles = FilteredDataModule.selected_profile_ids;
    selectedFiles.forEach((fileId) => {
      EvaluationModule.removeEvaluation(fileId);
      InspecDataModule.removeFile(fileId);
      // Remove any database files that may have been in the URL
      // by calling the router and causing it to write the appropriate
      // route to the URL bar
      this.navigateWithNoErrors(`/${this.currentRoute}`);
    });
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

.clickable {
  cursor: pointer;
}
</style>
