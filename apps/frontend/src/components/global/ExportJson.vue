<template>
  <v-tooltip top>
    <template v-slot:activator="{on}">
      <LinkItem
        key="export_json"
        text="Export as JSON"
        icon="mdi-download"
        @click="export_json()"
        v-on="on"
      />
    </template>
    <span>JSON Download</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {saveAs} from 'file-saver';
import LinkItem, {
  LinkAction
} from '@/components/global/sidebaritems/SidebarLink.vue';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {getModule} from 'vuex-module-decorators';
import InspecDataModule from '../../store/data_store';

// We declare the props separately
// to make props types inferrable.
const Props = Vue.extend({
  props: {}
});

@Component({
  components: {
    LinkItem
  }
})
export default class ExportJSON extends Props {
  export_json() {
    let id_string: string = this.$route.params.id;
    let file_id = parseInt(id_string);
    let store = getModule(InspecDataModule, this.$store);
    let file = store.allFiles.find(f => f.unique_id === file_id);
    if (file) {
      if (file.hasOwnProperty('execution')) {
        this.export_execution(file as EvaluationFile);
      } else {
        this.export_profile(file as ProfileFile);
      }
    }
  }

  export_execution(file?: EvaluationFile) {
    if (file) {
      let blob = new Blob([JSON.stringify(file.execution)], {
        type: 'application/json'
      });
      if (blob) {
        saveAs(blob, file.filename);
      }
    }
  }

  export_profile(file?: ProfileFile) {
    if (file) {
      let blob = new Blob([JSON.stringify(file.profile)], {
        type: 'application/json'
      });
      if (blob) {
        saveAs(blob, file.filename);
      }
    }
  }
}
</script>
