<template>
  <v-navigation-drawer
    :value="value"
    :clipped="$vuetify.breakpoint.lgAndUp"
    app
    :style="{'margin-top': classification ? '5em' : '3.5em', 'z-index': 11}"
    disable-resize-watcher
    disable-route-watcher
    fixed
    temporary
    width="600px"
    @input="$emit('input', $event)"
    @blur="value = false"
  >
    <v-expansion-panels v-model="active_path" accordion>
      <DropdownContent
        header-text="Results"
        :files="visible_evaluation_files"
        :all-selected="all_evaluations_selected"
        :any-selected="any_evaluation_selected"
        :enable-compare-view="true"
        :compare-view-active="compareViewActive"
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
        @remove-selected="removeSelectedProfiles"
        @toggle-all="toggle_all_profiles"
        @changed-files="$emit('changed-files')"
      />
      <DropdownContent
        header-text="SBOMs"
        :files="visible_sbom_files"
        :all-selected="all_evaluations_selected"
      />
    </v-expansion-panels>
  </v-navigation-drawer>
</template>

<script lang="ts">
import DropdownContent from '@/components/global/sidebaritems/DropdownContent.vue';
import {Trinary} from '@/enums/Trinary';
import RouteMixin from '@/mixins/RouteMixin';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {ServerModule} from '../../store/server';
import {EvaluationModule} from '@/store/evaluations';
import _ from 'lodash';

@Component({
  components: {
    DropdownContent
  }
})
export default class Sidebar extends mixins(RouteMixin) {
  @Prop({type: Boolean}) value!: boolean;

  // open the appropriate v-expansion-panel based on current route
  get active_path() {
    if (this.current_route === 'results' || this.current_route === 'compare') {
      return 0;
    } else if (this.current_route === 'profiles') {
      return 1;
    } else if (this.current_route === 'sbom-view') {
      return 2;
    } else {
      return -1;
    }
  }

  set active_path(id: number) {
    // There are currently 3 available values that the v-modal can have,
    // 0 -> results view
    // 1 -> profile view
    // 2 -> sbom view
    if (id === 0) {
      this.navigateWithNoErrors(`/results`);
    } else if (id === 1) {
      this.navigateWithNoErrors(`/profiles`);
    } else if (id === 2) {
      this.navigateWithNoErrors(`/sbom-view`);
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

  get visible_sbom_files(): EvaluationFile[] {
    // get all the evaluation files that have at least one passthrough.auxiliary_data element
    // that is from an SBOM
    const files = InspecDataModule.allEvaluationFiles.filter((f) =>
      _.some(
        _.get(f, 'evaluation.data.passthrough.auxiliary_data'),
        _.matchesProperty('name', 'SBOM')
      )
    );
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

  // toggle between the comparison view and the results view
  compareView(): void {
    if (this.current_route === 'results') {
      this.navigateWithNoErrors('/compare');
    }
    if (this.current_route === 'compare') {
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
      this.navigateWithNoErrors(`/${this.current_route}`);
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
      this.navigateWithNoErrors(`/${this.current_route}`);
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
</style>
