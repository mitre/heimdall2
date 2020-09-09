<template>
  <v-app-bar :clipped-left="$vuetify.breakpoint.lgAndUp" app color="bar">
    <!-- The title and nav bar -->
    <v-toolbar-title id="toolbar_title" class="pr-2">
      <v-app-bar-nav-icon @click.stop="$emit('toggle-drawer')">
        <v-icon color="bar-visible">mdi-menu</v-icon>
      </v-app-bar-nav-icon>
      <span class="hidden-sm-and-down bar-visible--text">{{ title }}</span>
    </v-toolbar-title>
    <v-spacer />

    <!-- Our customizable content -->
    <slot></slot>

    <v-btn
      @click="uploadModal = true"
      :disabled="uploadModal"
      class="mx-2"
      id="upload-btn"
    >
      <span class="d-none d-md-inline pr-2">
        Load
      </span>
      <v-icon>
        mdi-cloud-upload
      </v-icon>
    </v-btn>
    <v-btn v-if="serverMode" @click="logOut" id="logout">
      <span class="d-none d-md-inline pr-2">
        Logout
      </span>
      <v-icon>
        mdi-logout
      </v-icon>
    </v-btn>

    <HelpAboutDropdown />
    <v-btn icon large v-on:click="toggleDark">
      <v-icon :color="this.$vuetify.theme.dark ? 'grey' : 'white'"
        >mdi-theme-light-dark</v-icon
      >
    </v-btn>
    <!-- File select modal -->
    <UploadNexus v-model="uploadModal" @got-files="on_got_files" />
  </v-app-bar>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import HelpAboutDropdown from '@/components/global/HelpAboutDropdown.vue';
import {BackendModule} from '@/store/backend';
import {FileID} from '@/store/report_intake';
import UploadNexus from '@/components/global/UploadNexus.vue';

// We declare the props separately to make props types inferable.
const TopbarProps = Vue.extend({
  props: {
    title: String
  }
});

@Component({
  components: {
    UploadNexus,
    HelpAboutDropdown
  }
})
export default class Topbar extends TopbarProps {
  uploadModal: boolean = false;

  /** Submits an event to clear all filters */
  clear(): void {
    this.$emit('clear');
  }

  /** Updates theme darkness */
  toggleDark() {
    this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
  }

  /**
   * Invoked when file(s) are loaded.
   */
  on_got_files(ids: FileID[]) {
    // Close the dialog
    this.uploadModal = false;
  }

  get serverMode() {
    return BackendModule.serverMode;
  }

  logOut() {
    BackendModule.Logout();
  }
}
</script>
