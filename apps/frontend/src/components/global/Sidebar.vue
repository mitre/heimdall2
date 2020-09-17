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
      <FileItem v-for="(file, i) in visible_files" :key="i" :file="file" />
      <v-list-item title="Show all files' controls" @click="toggle_all">
        <v-list-item-avatar>
          <v-icon small>mdi-format-list-bulleted</v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>
            <div v-if="all_toggled">Deselect all reports</div>
            <div v-else>Select all reports</div>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-subheader>Views</v-subheader>
      <v-list-item to="/results" title="View controls' results">
        <v-list-item-avatar>
          <v-icon small>mdi-television-guide</v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>Results</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/compare" title="Compare evaluations' controls">
        <v-list-item-avatar>
          <v-icon small>mdi-triangle-outline</v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>Comparison</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';
import FileItem from '@/components/global/sidebaritems/SidebarFile.vue';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {FilteredDataModule} from '../../store/data_filters';

// We declare the props separately to make props types inferable.
const SidebarProps = Vue.extend({
  props: {
    value: Boolean // Whether or not this item should make itself visible
  }
});

@Component({
  components: {
    LinkItem,
    FileItem
  }
})
export default class Sidebar extends SidebarProps {
  //selects/deselects all files. Will select all unless all are already selected
  toggle_all(): void {
    if (this.all_toggled) {
      FilteredDataModule.set_toggled_files([]);
    } else {
      FilteredDataModule.set_toggled_files(
        InspecDataModule.allFiles.map(v => v.unique_id)
      );
    }
  }

  //checks if all files are selected
  get all_toggled(): boolean {
    return (
      InspecDataModule.allFiles.length ==
      FilteredDataModule.selected_file_ids.length
    );
  }

  /** Generates files for all */
  get visible_files(): Array<ProfileFile | EvaluationFile> {
    let files = InspecDataModule.allFiles;
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
