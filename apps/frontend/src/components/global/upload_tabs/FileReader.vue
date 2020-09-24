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
                v-model="fileRecords"
                :multiple="true"
                :help-text="'Choose files to upload'"
                @select="filesSelected"
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

import {InspecIntakeModule, FileID} from '@/store/report_intake';
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

  filesSelected() {
    this.loading = true;
    this.commit_files(this.fileRecords.map(record => record.file));
    this.fileRecords = new Array();
  }

  /** Callback for our file reader */
  commit_files(files: File[]) {
    Promise.all(
      files.map(file => {
        return InspecIntakeModule.loadFile({file}).catch(err => {
          this.$toasted.global.error({
            message: String(err)
          });
        });
      })
    )
      .then((fileIds: (FileID | void)[]) => {
        // Since catching errors is handled by loadFile above,
        // filter(Boolean) is used here to remove any falsey values.
        this.$emit('got-files', fileIds.filter(Boolean));
      })
      .finally(() => {
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
