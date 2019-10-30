<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="12" align="center">
          <!-- Use inline style to emulate v-img props -->
          <img
            src="@/assets/logo-orange-tsp.svg"
            svg-inline
            style="max-width: 164px; max-height: 164px;"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" align="center">
          <div class="d-flex flex-column justify-center">
            <span :class="title_class">Heimdall</span>
            <span :class="title_class">Lite</span>
            <span class="subtitle-2 px-0">{{ version }}</span>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" align="center">
          <UploadButton @files-selected="commit_files" />
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import UploadButton from "@/components/global/UploadButton.vue";
import InspecIntakeModule, {
  FileID,
  next_free_file_ID
} from "@/store/report_intake";
import AppInfoModule from "@/store/app_info";

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
  components: {
    UploadButton
  }
})
export default class FileReader extends Props {
  /** Callback for our file reader */
  commit_files(files: File[]) {
    // Coerce into a more ergonomic type
    let unique_ids: FileID[] = []; // Use this to track generated file ids
    files.forEach(file => {
      // Generate file ids
      let unique_id = next_free_file_ID();
      unique_ids.push(unique_id);

      // The error toast is globally registered, and has no awareness of the
      // theme setting, so this component passes it up
      let toast = this.$toasted.global.error;
      let isDark = this.$vuetify.theme.dark;

      // Submit it to be loaded, and display an error if it fails
      let intake_module = getModule(InspecIntakeModule, this.$store);
      intake_module.loadFile({ file, unique_id }).then(err => {
        if (err) {
          console.error(`Error loading file ${file.name}`);
          toast({
            message: String(err),
            isDark: isDark
          });
        }
      });

      // Todo: Set the uploaded files as "active" in some sort of file selection scheme
    });

    // Notify we got files
    this.$emit("got-files", unique_ids);
  }

  get title_class(): string[] {
    if (this.$vuetify.breakpoint.mdAndUp) {
      return ["display-4", "px-0"];
    } else {
      return ["display-2", "px-0"];
    }
  }

  get version(): string {
    return getModule(AppInfoModule, this.$store).version;
  }
}
</script>
