<template>
  <v-navigation-drawer
    :value="value"
    @input="$emit('input', $event)"
    :clipped="$vuetify.breakpoint.lgAndUp"
    app
    style="margin-top: 56px;"
    disable-resize-watcher
    fixed
    temporary
    width="375px"
  >
    <v-list dense class="px-2" subheader>
      <v-subheader>Files</v-subheader>
      <FileItem v-for="(file, i) in visible_files" :key="i" :file="file" />
      <v-list-item to="/results/all" title="Show all files' controls">
        <v-list-item-avatar>
          <v-icon small>mdi-format-list-bulleted</v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>All reports</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-list dense class="px-2" subheader>
      <v-subheader>Tools</v-subheader>
      <slot></slot>
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
import {InspecFile, EvaluationFile, ProfileFile} from '@/store/report_intake';
import {getModule} from 'vuex-module-decorators';
import InspecDataModule from '@/store/data_store';
import FileItem from '@/components/global/sidebaritems/SidebarFile.vue';
import LinkItem from '@/components/global/sidebaritems/SidebarLink.vue';
import AboutModal from '@/components/global/AboutModal.vue';
import HelpModal from '@/components/global/HelpModal.vue';

// We declare the props separately to make props types inferable.
const SidebarProps = Vue.extend({
  props: {
    value: Boolean // Whether or not this item should make itself visible
  }
});

@Component({
  components: {
    LinkItem,
    FileItem,
    AboutModal,
    HelpModal
  }
})
export default class Sidebar extends SidebarProps {
  /** Generates files for all */
  get visible_files(): Array<ProfileFile | EvaluationFile> {
    let data_store = getModule(InspecDataModule, this.$store);
    let files = data_store.allFiles;
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
