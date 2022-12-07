<template>
  <div>
    <v-navigation-drawer
      :clipped="$vuetify.breakpoint.lgAndUp"
      app
      :style="{'z-index': 11}"
      disable-resize-watcher
      disable-route-watcher
      fixed
      permanent
      width="45px"
      @input="$emit('input', $event)"
      @blur="value = false"
    >
      <v-container v-if="!isSideUtilityDrawerShown" fill-height fluid>
        <v-row align="center" justify="center">
          <v-col
            ><v-icon
              class="text-center"
              right
              @click="isSideUtilityDrawerShown = !isSideUtilityDrawerShown"
              >mdi-arrow-right</v-icon
            ></v-col
          >
        </v-row>
      </v-container>
    </v-navigation-drawer>
    <v-navigation-drawer
      v-model="isSideUtilityDrawerShown"
      :clipped="$vuetify.breakpoint.lgAndUp"
      app
      :style="{'z-index': 11, 'margin-top': classification ? '5em' : '3em'}"
      disable-resize-watcher
      disable-route-watcher
      fixed
      temporary
      width="600px"
      @input="$emit('input', $event)"
      @blur="value = false"
    >
      <div v-if="isSideUtilityDrawerShown">
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
            :all-selected="all_checklists_selected"
            @toggle-all="toggle_all_checklists"
            @changed-files="$emit('changed-files')"
          />
        </v-expansion-panels>
        <div class="mx-5 mr-10 mb-5">
          <v-divider class="mb-5" />
          <v-row class="my-4">
            <v-btn
              id="upload-btn"
              :disabled="showModal"
              class="mx-2"
              @click="show_modal"
            >
              <span class="d-none d-md-inline pr-2">
                Add/Update Target Data
              </span>
              <v-icon> mdi-cloud-upload </v-icon>
            </v-btn>
            <v-btn
              id="upload-btn"
              :disabled="showModal"
              class="mx-2"
              @click="show_modal"
            >
              <span class="d-none d-md-inline pr-2">
                Add/Update Technology Area
              </span>
              <v-icon> mdi-cloud-upload </v-icon>
            </v-btn>
          </v-row>
          <h1 class="my-4">Quick Filters:</h1>
          <v-row class="my-4">
            <v-col
              v-for="item in controlStatusSwitches"
              :key="item.name"
              :cols="3"
              >{{ item.name }}</v-col
            >
          </v-row>
          <v-row class="mt-n10">
            <v-col
              v-for="item in controlStatusSwitches"
              :key="item.name"
              v-model="controlStatusSwitches"
              :cols="3"
            >
              <v-switch
                v-model="item.enabled"
                dense
                justify="center"
                inset
                :color="item.color"
                hide-details
                @change="changeStatusToggle(item.name)"
              />
              <!-- numStatus(item.value)  -->
            </v-col>
          </v-row>
          <v-row>
            <v-col
              v-for="item in severitySwitches"
              :key="item.name"
              :cols="3"
              >{{ item.name }}</v-col
            >
            <!-- <v-col :cols="3">Short ID</v-col> -->
          </v-row>
          <v-row class="mt-n10">
            <v-col v-for="item in severitySwitches" :key="item.name" :cols="3">
              <v-switch
                v-model="item.enabled"
                dense
                justify="center"
                inset
                :color="item.color"
                hide-details
                @change="changeSeverityToggle(item.name)"
              />
              <!-- :label='numSeverity(item.value)'' -->
            </v-col>
            <!-- <v-col :cols="3">
          <v-switch
            v-model="shortIdEnabled"
            dense
            justify="center"
            inset
            color="teal"
            hide-details
          />
        </v-col> -->
          </v-row>
          <h1 class="my-4">Category Filters:</h1>
          <v-row class="my-4">
            <v-select
              v-model="currentFreeTextFilterCategory"
              class="mx-2 select"
              :items="categories"
              label="Filter Categories"
              dark
            />
            <v-text-field
              v-model="currentFreeTextFilterInput"
              class="mr-2"
              label="Enter filter keyword"
              dark
            />
            <v-btn
              id="upload-btn"
              class="mx-2"
              @click="
                addCategoryFilter(
                  currentFreeTextFilterCategory,
                  currentFreeTextFilterInput
                )
              "
            >
              <span class="d-none d-md-inline pr-2"> Add </span>
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
import {Prop} from 'vue-property-decorator';
import {ServerModule} from '../../store/server';

import {SearchModule} from '@/store/search';
import {Severity} from 'inspecjs';

@Component({
  components: {
    DropdownContent
  }
})
export default class Sidebar extends mixins(RouteMixin) {
  @Prop({type: Boolean}) readonly value!: boolean;

  addCategoryFilter(field: string, value: string) {
    SearchModule.addSearchFilter({
      field,
      value
    });
  }

  get controlStatusSwitches(): any {
    return FilteredDataModule.controlStatusSwitches;
  }

  get severitySwitches(): any {
    return FilteredDataModule.severitySwitches;
  }

  changeSeverityToggle(name: Severity) {
    FilteredDataModule.changeSeveritySwitch(name);
  }

  changeStatusToggle(name: ExtendedControlStatus) {
    FilteredDataModule.changeStatusSwitch(name);
  }

  showModal = false;

  isSideUtilityDrawerShown = false;

  setUtilityDrawerBoolean() {
    this.isSideUtilityDrawerShown = !this.isSideUtilityDrawerShown;
  }

  shortIdEnabled = false;

  show_modal() {
    //TODO: Implement modal
    console.log('I should open modal!');
  }

  currentFreeTextFilterInput = '';
  currentFreeTextFilterCategory = '';

  categories = [
    'Vul ID',
    'Rule ID',
    'Stig ID',
    'Classification',
    'Group Name',
    'CCIs',
    'Keywords'
  ];

  // open the appropriate v-expansion-panel based on current route
  get active_path() {
    if (this.current_route === 'checklists') {
      return 2;
    } else if (this.current_route === 'profiles') {
      return 1;
    } else if (
      this.current_route === 'results' ||
      this.current_route === 'compare'
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

  get all_checklists_selected(): Trinary {
    return Trinary.Mixed;
  }

  get checklist_selected(): Trinary {
    return FilteredDataModule.checklist_selected;
  }

  get compareViewActive(): boolean {
    return this.current_route === 'compare';
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

  toggle_all_checklists(): void {
    // Meaningless function
  }

  // toggle between the comparison view and the results view
  compareView(): void {
    if (this.current_route === 'results') {
      this.navigateWithNoErrors('/compare');
    }
    if (this.current_route === 'compare') {
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
