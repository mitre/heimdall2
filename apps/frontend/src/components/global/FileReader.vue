<template>
  <div>
    <v-file-input
      v-model="curr_file"
      display-size
      multiple
      accept=".json,application/json"
      label="Upload inspec data"
      @change="commitFile"
    ></v-file-input>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import InspecIntakeModule, {
  FileID,
  next_free_file_ID
} from "@/store/report_intake";

/** Coerces the types held by a filereader into an array */
function fix_files(f: File | File[] | null | undefined): File[] {
  if (f === null || f === undefined) {
    return [];
  } else if (Array.isArray(f)) {
    return f;
  } else {
    return [f];
  }
}

// We declare the props separately to make props types inferable.
const FileReaderProps = Vue.extend({
  props: {
    text: String
  }
});

/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {}
})
export default class FileReader extends FileReaderProps {
  curr_file: File | File[] | null | undefined = null;

  /** Callback for our file reader */
  commitFile(provided_files: File | File[] | null) {
    // Coerce into a more ergonomic type
    let files = fix_files(provided_files);
    let unique_ids: FileID[] = []; // Use this to track generated file ids
    if (files.length > 0) {
      files.forEach(file => {
        // Generate file ids
        let unique_id = next_free_file_ID();
        unique_ids.push(unique_id);

        // Submit it to be loaded
        let intake_module = getModule(InspecIntakeModule, this.$store);
        intake_module.loadFile({ file, unique_id });

        // Todo: Set the uploaded files as "active" in some sort of file selection scheme
      });

      // Notify we got files
      this.$emit("got-files", unique_ids);

      // Clear
      this.curr_file = [];
    }
  }
}
</script>
