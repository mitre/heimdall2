<template>
  <div class="caption font-weight-medium">
    <v-btn :small="$vuetify.breakpoint.smAndDown" @click="show_selector">
      Upload
      <v-icon :small="$vuetify.breakpoint.smAndDown" class="pl-2"
        >mdi-file-upload</v-icon
      >
    </v-btn>
    <div hidden>
      <input
        ref="real-input"
        type="file"
        multiple
        @change="select_file"
        accept=".json, application/json"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});

/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {}
})
export default class UploadButton extends Props {
  /** Callback for our file reader */
  select_file() {
    let raw_files = (this.$refs["real-input"] as any).files as
      | FileList
      | undefined
      | null;
    // Coerce into a more ergonomic type
    let files = fix_files(raw_files);
    if (files.length > 0) {
      // Notify we got files
      this.$emit("files-selected", files);
    }

    // Clear
    // this.curr_file = [];
  }

  /** Programatically show real input selector */
  show_selector() {
    let file_input = this.$refs["real-input"];
    (file_input as any).click();
  }
}
/** Coerces the types held by a filereader into an array */
function fix_files(f: FileList | null | undefined): File[] {
  if (f === null || f === undefined) {
    return [];
  } else {
    return [...f];
  }
}
</script>
