<template>
  <div>
    <v-file-input
      ref="fileInput"
      chips
      multiple
      display-size
      counter
      :clearable="false"
      accept=".json,application/json"
      label="Upload inspec data"
      @change="filesSelected"
    ></v-file-input>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const FileReaderProps = Vue.extend({
  props: {
    text: String
  }
});

@Component({
  components: {}
})
export default class FileReader extends FileReaderProps {
  $refs!: {
    fileInput: any; // v-file-input
  };

  filesSelected(files: File[]) {
    files.forEach(file => {
      // Submit it to be loaded
      let unique_id = this.$store.getters["data/nextFreeFileID"];
      this.$store.dispatch("intake/loadFile", { file, unique_id });

      // If we only have one file, go to it
      if (files.length == 1) {
        // Go to that directory
        // this.$router.push("/results/" + unique_id);
      }

      // Clear it
      // this.$refs.fileInput.value = [];
    });
  }
}
</script>
