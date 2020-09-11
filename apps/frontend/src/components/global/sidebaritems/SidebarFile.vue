<template>
  <v-list-item :title="file.filename" @click="select_file_exclusive">
    <v-list-item-action @click="select_file">
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

    <v-list-item-action @click="close_this_file">
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
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {ServerModule} from '@/store/server';
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
  host: string = 'http://localhost:8050';

  select_file(evt: Event) {
    evt.stopPropagation();
    evt.preventDefault();
    if (!this.selected) {
      FilteredDataModule.set_toggle_file_on(this.file.unique_id);
    } else {
      FilteredDataModule.set_toggle_file_off(this.file.unique_id);
    }
  }

  select_file_exclusive(evt: Event) {
    let files = FilteredDataModule.selected_profiles;
    files.push(this.file.unique_id);
    FilteredDataModule.set_toggled_files(files);

    this.$router.push({path: '/results'});
  }

  //checks if file is selected
  get selected(): boolean {
    return FilteredDataModule.selected_file_ids.includes(this.file.unique_id);
  }

  //removes uploaded file from the currently observed files, not from database
  close_this_file(evt: Event) {
    InspecDataModule.removeFile(this.file.unique_id);
  }

  //saves file to database
  save_this_file(evt: Event) {
    evt.stopPropagation();
    evt.preventDefault();
    let file = InspecDataModule.allFiles.find(
      f => f.unique_id === this.file.unique_id
    );
    if (file) {
      if (file.hasOwnProperty('execution')) {
        this.save_evaluation(file as EvaluationFile);
      } else {
        this.save_profile(file as ProfileFile);
      }
    }
  }

  async save_evaluation(file?: EvaluationFile): Promise<void> {
    // checking if the input is valid
    if (file) {
      await ServerModule.connect(this.host)
        .catch(bad => {
          console.error('Unable to connect to ' + this.host);
        })
        .then(() => {
          return ServerModule.save_evaluation(file);
        })
        .catch(bad => {
          console.error(`bad save ${bad}`);
        });
    }
  }

  //saves profile to database
  save_profile(file?: ProfileFile) {
    // Strip the file
    if (file) {
      let decontextualized = file.profile.data;
      let blob = new Blob([JSON.stringify(decontextualized)], {
        type: 'application/json'
      });
    }
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
