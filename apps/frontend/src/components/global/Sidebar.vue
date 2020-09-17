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
      <v-subheader>Views</v-subheader>
      <div v-if="visible_evaluation_files.length > 0">
        <v-list-item to="/results" title="View results">
          <v-list-item-avatar>
            <v-icon small>mdi-television-guide</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Results View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <div v-else>
        <v-list-item title="View results">
          <v-list-item-avatar>
            <v-icon small>mdi-television-guide</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Results View (why is link deactivated?)
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <div v-if="visible_evaluation_files.length > 0">
        <v-list-item to="/compare" title="Compare results">
          <v-list-item-avatar>
            <v-icon small>mdi-triangle-outline</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Results Comparison View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <div v-else>
        <v-list-item title="Compare results">
          <v-list-item-avatar>
            <v-icon small>mdi-triangle-outline</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Results Comparison View (why is link deactivated?)
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <div v-if="visible_profile_files.length > 0">
        <v-list-item to="/profiles" title="View profiles">
          <v-list-item-avatar>
            <v-icon small>mdi-television-guide</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Profiles View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <div v-else>
        <v-list-item title="View profiles">
          <v-list-item-avatar>
            <v-icon small>mdi-television-guide</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Profiles View (why is link deactivated?)
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <v-subheader>Files</v-subheader>
      <v-expansion-panels v-model="file_views" flat>
        <DropdownContent
          text="Results"
          toggle="Select all result set"
          :files="visible_evaluation_files"
        />
        <DropdownContent
          text="Profiles"
          toggle="Select all profile set"
          :files="visible_profile_files"
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
    // open the appropriate v-expansion-panel based on current route
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
