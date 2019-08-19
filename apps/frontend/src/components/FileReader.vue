<template>
  <div>
    <v-file-input
      v-model="curr_file"
      display-size
      accept=".json,application/json"
      label="Upload inspec data"
      @change="commitFile"
    ></v-file-input>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

function isValidFile(f: File | File[] | null): f is File {
  if (f === null || f === undefined) {
    return false;
  } else {
    return (f as File).name !== undefined;
  }
}

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
  curr_file: File | File[] | null = null;

  commitFile(file: File | File[] | null) {
    if (isValidFile(file)) {
      // Submit it to be loaded
      let unique_id = this.$store.getters["data/nextFreeFileID"];
      this.$store.dispatch("intake/loadFile", { file, unique_id });
      this.$router.push(`/results/${unique_id}`);
      this.$emit("got-file", unique_id);

      // Clear
      this.curr_file = [];
    }
  }
}
</script>
