<template>
  <v-navigation-drawer :value="value" :clipped="$vuetify.breakpoint.lgAndUp" app
    :style="{ 'margin-top': classification ? '5em' : '3.5em', 'z-index': 11 }" disable-resize-watcher
    disable-route-watcher fixed temporary width="600px" @input="$emit('input', $event)" @blur="value = false">
    <v-expansion-panels v-model="active_path" accordion>
      <DropdownContent header-text="Results" :files="visible_evaluation_files" :all-selected="all_evaluations_selected"
        :enable-compare-view="true" :compare-view-active="compareViewActive" @toggle-all="toggle_all_evaluations"
        @toggle-compare-view="compareView" @changed-files="$emit('changed-files')" />
      <DropdownContent header-text="Profiles" :files="visible_profile_files" :all-selected="all_profiles_selected"
        @toggle-all="toggle_all_profiles" @changed-files="$emit('changed-files')" />
      <DropdownContent header-text="Checklists" :files="visible_checklist_files" :all-selected="all_checklists_selected"
        @toggle-all="toggle_all_checklists" @changed-files="$emit('changed-files')" />
    </v-expansion-panels>
  </v-navigation-drawer>
</template>

<script lang="ts">
import DropdownContent from '@/components/global/sidebaritems/DropdownContent.vue';
import { Trinary } from '@/enums/Trinary';
import RouteMixin from '@/mixins/RouteMixin';
import { FilteredChecklistDataModule } from '@/store/checklist_data_filters';
import { FilteredDataModule } from '@/store/data_filters';
import { InspecDataModule } from '@/store/data_store';
import { EvaluationFile, ProfileFile } from '@/store/report_intake';
import { ChecklistFile } from '@/types/checklist/control';
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { ServerModule } from '../../store/server';

@Component({
  components: {
    DropdownContent
  }
})
export default class Sidebar extends mixins(RouteMixin) {
  @Prop({ type: Boolean }) readonly value!: boolean;

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
    return FilteredChecklistDataModule.all_checklists_selected;
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

  // toggle the "select all" for checklists
  toggle_all_checklists(): void {
    FilteredChecklistDataModule.toggle_all_checklists();
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
</style>
