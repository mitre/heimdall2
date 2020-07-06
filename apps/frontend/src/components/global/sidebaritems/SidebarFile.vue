<template>
  <v-list-item :to="`/results/${file.unique_id}`" :title="file.filename">
    <v-list-item-avatar>
      <v-icon v-text="icon" small />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title v-text="file.filename" />
    </v-list-item-content>

    <v-list-item-action @click="save_this_file">
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
import {getModule} from 'vuex-module-decorators';
import InspecDataModule from '@/store/data_store';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import ServerModule from '@/store/server';

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

  close_this_file(evt: Event) {
    evt.stopPropagation();
    evt.preventDefault();
    let data_store = getModule(InspecDataModule, this.$store);
    data_store.removeFile(this.file.unique_id);
  }

  save_this_file(evt: Event) {
    evt.stopPropagation();
    evt.preventDefault();
    console.log('save this file');
    let data_store = getModule(InspecDataModule, this.$store);
    let file = data_store.allFiles.find(
      f => f.unique_id === this.file.unique_id
    );
    console.log('got file');
    if (file) {
      if (file.hasOwnProperty('execution')) {
        this.save_evaluation(file as EvaluationFile);
      } else {
        this.save_profile(file as ProfileFile);
      }
    }
  }

  async save_evaluation(file?: EvaluationFile): Promise<void> {
    console.log('Save evaluation to ' + this.host);
    // checking if the input is valid
    if (file) {
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(this.host)
        .catch(bad => {
          console.error('Unable to connect to ' + this.host);
        })
        .then(() => {
          console.log('mode.save_evaluation');
          return mod.save_evaluation(file);
        })
        .catch(bad => {
          console.error(`bad save ${bad}`);
        });
    }
  }

  save_profile(file?: ProfileFile) {
    if (file) {
      let blob = new Blob([JSON.stringify(file.profile)], {
        type: 'application/json'
      });
    }
  }

  get icon(): string {
    if (this.file.profile !== undefined) {
      return 'note';
    } else {
      return 'mdi-google-analytics';
    }
  }
}
</script>
