<template>
  <v-card class="elevation-0">
    <v-card-subtitle
      >Easily load any supported Heimdall Data Format file</v-card-subtitle
    >
    <v-container>
      <v-row>
        <v-col cols="12" align="center">
          <v-img
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
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col align="center" cols="12">
          <div class="caption font-weight-medium">
            <div v-if="!loading">
              <VueFileAgent
                ref="vueFileAgent"
                :multiple="true"
                :helpText="'Choose files to upload'"
                @select="filesSelected($event)"
                v-model="fileRecords"
              />
            </div>
            <div v-else>
              <v-progress-circular
                indeterminate
                color="#ff5600"
                :size="80"
                :width="20"
              />
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import {
  InspecIntakeModule,
  FileID,
  next_free_file_ID
} from '@/store/report_intake';
import {AppInfoModule} from '@/store/app_info';
import vueFileAgent from 'vue-file-agent';
import 'vue-file-agent/dist/vue-file-agent.css';

Vue.use(vueFileAgent);

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});
/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({})
export default class FileReader extends Props {
  fileRecords = new Array();
  loading = false;

  filesSelected(fileRecordsNewlySelected: any) {
    this.loading = true;
    this.commit_files(this.fileRecords.map(record => record.file));
    this.fileRecords = new Array();
  }

  /** Callback for our file reader */
  commit_files(files: File[]) {
    let valid_ids: FileID[] = []; // Use this to track those that get successfully uploaded

    // Promise an upload of each
    let upload_promises = files.map(file => {
      // Generate file id
      let unique_id = next_free_file_ID();

      // Submit it to be loaded, and display an error if it fails
      return InspecIntakeModule.loadFile({file, unique_id}).then(err => {
        if (err) {
          console.error(`Error loading file ${file.name}`);
          this.$toasted.global.error({
            message: String(err),
            isDark: this.$vuetify.theme.dark
          });
        } else {
          // Store the given id as valid
          valid_ids.push(unique_id);
        }
      });
    });

    // When they're all done, emit event.
    // To use promise.all we must make each promise explicitly allow rejection without breaking promise.all failfast
    let guaranteed_promises = upload_promises.map(p => p.catch(err => err));
    Promise.all(guaranteed_promises).then(_ => {
      this.$emit('got-files', valid_ids);
      this.loading = false;
    });
  }

  get title_class(): string[] {
    if (this.$vuetify.breakpoint.mdAndUp) {
      return ['display-4', 'px-0'];
    } else {
      return ['display-2', 'px-0'];
    }
  }

  get version(): string {
    return AppInfoModule.version;
  }
}
</script>

<style>
.file-preview-new::before {
  background: transparent !important;
}
</style>
