<template>
  <v-list-item :title="file.filename" @click.stop="select_file_exclusive">
    <v-list-item-action @click.stop="select_file">
      <v-checkbox :input-value="selected" color="blue" />
    </v-list-item-action>

    <v-list-item-avatar>
      <v-icon small v-text="icon" />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title v-text="file.filename" />
    </v-list-item-content>

    <v-list-item-action v-if="serverMode" @click="save_this_file">
      <v-btn icon small>
        <v-icon> mdi-content-save </v-icon>
      </v-btn>
    </v-list-item-action>

    <v-list-item-action @click.stop="close_this_file">
      <v-btn icon small>
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {InspecDataModule} from '@/store/data_store';
import {FilteredDataModule} from '@/store/data_filters';

import {BackendModule} from '@/store/backend';

// We declare the props separately to make props types inferable.
const FileItemProps = Vue.extend({
  props: {
    file: Object // Of type EvaluationFile or ProfileFile
  }
});

@Component({
  components: {}
})
export default class FileItem extends FileItemProps {
  select_file(evt: Event) {
    if (!this.selected) {
      FilteredDataModule.set_toggle_file_on(this.file.unique_id);
    } else {
      FilteredDataModule.set_toggle_file_off(this.file.unique_id);
    }
  }

  select_file_exclusive(evt: Event) {
    let path = '';

    if (this.file.hasOwnProperty('evaluation')) {
      let files = FilteredDataModule.selected_profiles;
      files.push(this.file.unique_id);
      FilteredDataModule.set_toggled_files(files);
      path = '/results';
    } else if (this.file.hasOwnProperty('profile')) {
      let files = FilteredDataModule.selected_evaluations;
      files.push(this.file.unique_id);
      FilteredDataModule.set_toggled_files(files);
      path = '/profiles';
    }

    if (path != this.$router.currentRoute.path) this.$router.push({path: path});
  }

  //checks if file is selected
  get selected(): boolean {
    return FilteredDataModule.selected_file_ids.includes(this.file.unique_id);
  }

  //removes uploaded file from the currently observed files
  close_this_file(evt: Event) {
    InspecDataModule.removeFile(this.file.unique_id);
  }

  //gives different icons for a file if it is just a profile
  get icon(): string {
    if (this.file.profile !== undefined) {
      return 'note';
    } else {
      return 'mdi-google-analytics';
    }
  }

  //checks if heimdall is in server mode
  get serverMode() {
    return BackendModule.serverMode;
  }
}
</script>
