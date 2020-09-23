<template>
  <v-navigation-drawer
    :value="value"
    :clipped="$vuetify.breakpoint.lgAndUp"
    app
    style="margin-top: 56px;"
    disable-resize-watcher
    fixed
    temporary
    width="375px"
    @input="$emit('input', $event)"
  >
    <v-list dense class="px-2" subheader>
      <v-subheader>Files</v-subheader>
      <v-expansion-panels v-model="file_views" flat>
        <DropdownContent
          text="Results"
          toggle="Select all result set"
          :files="visible_evaluation_files"
          route="/results"
          :showdeltaview="true"
          :openview="true"
          :showtoggle="true"
          @toggleAll="toggle_all_evaluations"
          @compare="compareView"
        />
        <DropdownContent
          text="Profiles"
          toggle="Select all profile set"
          :files="visible_profile_files"
          route="/profiles"
          :openview="true"
          :showtoggle="true"
          @toggleAll="toggle_all_profiles"
        />
      </v-expansion-panels>
    </v-list>
    <v-list dense class="px-2" subheader>
      <v-subheader>Tools</v-subheader>
      <slot />
    </v-list>
    <v-list dense class="px-2" subheader>
      <v-subheader>Info</v-subheader>
      <AboutModal>
        <template v-slot:clickable="{on}">
          <LinkItem key="about" text="About" icon="mdi-information" v-on="on" />
        </template>
      </AboutModal>
      <HelpModal>
        <template v-slot:clickable="{on}">
          <LinkItem key="help" text="Help" icon="mdi-help-circle" v-on="on" />
        </template>
      </HelpModal>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import AboutModal from '@/components/global/AboutModal.vue';
import HelpModal from '@/components/global/HelpModal.vue';
import {FilteredDataModule} from '@/store/data_filters';

import DropdownContent from '@/components/global/sidebaritems/DropdownContent.vue';

// We declare the props separately to make props types inferable.
const SidebarProps = Vue.extend({
  props: {
    value: Boolean // Whether or not this item should make itself visible
  }
});

@Component({
  components: {
    LinkItem,
    AboutModal,
    DropdownContent,
    HelpModal
  }
})
export default class Sidebar extends SidebarProps {
  // used to toggle v-exapansion-panel
  file_views = 0;
  drawer = true;

  created() {
    this.selectDropdown();
  }

  mounted() {
    this.selectDropdown();
  }

  // open the appropriate v-expansion-panel based on current route
  selectDropdown() {
    if (this.curr_route_path == '/results') this.file_views = 0;
    else if (this.curr_route_path == '/compare') this.file_views = 0;
    else if (this.curr_route_path == '/profiles') this.file_views = 1;
  }

  // get the value of the current route
  get curr_route_path() {
    return this.$router.currentRoute.path;
  }

  // get all visible (uploaded) evaluation files
  get visible_evaluation_files(): Array<EvaluationFile> {
    let files = InspecDataModule.allEvaluationFiles;
    files = files.sort((a, b) => a.filename.localeCompare(b.filename));
    return files;
  }

  // get all visible (uploaded) profile files
  get visible_profile_files(): Array<ProfileFile> {
    let files = InspecDataModule.allProfileFiles;
    files = files.sort((a, b) => a.filename.localeCompare(b.filename));
    return files;
  }

  // toggle the "select all" for profiles
  toggle_all_profiles(): void {
    if (FilteredDataModule.all_toggled_profiles) {
      FilteredDataModule.set_toggled_files(
        FilteredDataModule.selected_evaluations
      );
    } else {
      let files = InspecDataModule.allProfileFiles.map(v => v.unique_id);
      files.push(...FilteredDataModule.selected_evaluations);
      FilteredDataModule.set_toggled_files(files);
    }
  }

  // toggle the "select all" for evaluations
  toggle_all_evaluations(): void {
    if (FilteredDataModule.all_toggled_evaluations) {
      FilteredDataModule.set_toggled_files(
        FilteredDataModule.selected_profiles
      );
    } else {
      let files = InspecDataModule.allEvaluationFiles.map(v => v.unique_id);
      files.push(...FilteredDataModule.selected_profiles);
      FilteredDataModule.set_toggled_files(files);
    }
  }

  // toggle between the comparison view and the results view
  compareView(): void {
    if (this.$router.currentRoute.path === '/results')
      this.$router.push({path: '/compare'});
    if (this.$router.currentRoute.path === '/compare')
      this.$router.push({path: '/results'});
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
