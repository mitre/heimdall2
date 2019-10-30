<template>
  <v-list-item :to="`/results/${file.unique_id}`" :title="file.filename">
    <v-list-item-avatar>
      <v-icon v-text="icon" small />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title v-text="file.filename" />
    </v-list-item-content>

    <v-list-item-action @click="close_this_file">
      <v-btn icon small>
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import InspecDataModule from "@/store/data_store";

// We declare the props separately to make props types inferable.
const FileItemProps = Vue.extend({
  props: {
    file: Object // Of type ExecutionFile or ProfileFile
  }
});

@Component({
  components: {}
})
export default class FileItem extends FileItemProps {
  close_this_file(evt: Event) {
    evt.stopPropagation();
    evt.preventDefault();
    let data_store = getModule(InspecDataModule, this.$store);
    data_store.removeFile(this.file.unique_id);
  }

  get icon(): string {
    if (this.file.profile !== undefined) {
      return "note";
    } else {
      return "mdi-google-analytics";
    }
  }
}
</script>
