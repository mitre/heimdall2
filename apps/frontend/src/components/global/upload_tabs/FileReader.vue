<template>
  <v-container fluid>
    <v-card style="position: relative" class="elevation-0">
      <!-- <v-row class="pt-1" justify="space-between"> -->
      <v-sheet class="d-flex mb-6 bg-surface-variant">
        <v-sheet class="me-auto">
          <v-card-subtitle>
            Easily load any supported Data Format
          </v-card-subtitle>
        </v-sheet>
        <v-sheet class="pr-2 primary--text">Supported Formats:</v-sheet>
        <v-sheet>
          <v-tooltip bottom>
            <template #activator="{on, attrs}">
              <v-icon class="pr-2" color="primary" :attrs="attrs" v-on="on"
                >mdi-information-outline</v-icon
              >
            </template>
            <span>Supported Formats:</span>
            <ul>
              <li>InSpec/Heimdall Data Format</li>
              <li>AWS Security Finding Format (ASFF)</li>
              <li>Burp Suite</li>
              <li>Checklist</li>
              <li>DBProtect</li>
              <li>Fortify</li>
              <li>Golang Security Checker (GoSec)</li>
              <li>Ion Channel</li>
              <li>JFrog Xray</li>
              <li>Nessus</li>
              <li>Netsparker</li>
              <li>Nikto</li>
              <li>OWASP ZAP</li>
              <li>Prisma</li>
              <li>Static Analysis Results Interchange Format (SARIF)</li>
              <li>Scoutsuite</li>
              <li>Snyk</li>
              <li>Tenable (API)</li>
              <li>Twistlock</li>
              <li>Veracode</li>
              <li>XCCDF Results (native OpenSCAP and SCC outputs)</li>
            </ul>
          </v-tooltip>
        </v-sheet>
      </v-sheet>
      <!-- </v-row> -->
      <v-container style="margin-top: 5%">
        <v-row>
          <v-col cols="12" align="center">
            <v-img
              src="@/assets/logo-orange-tsp.svg"
              svg-inline
              style="max-width: 164px; max-height: 164px"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" align="center">
            <div class="d-flex flex-column justify-center">
              <span :class="title_class">Heimdall</span>
              <span v-if="serverMode" :class="title_class">Server</span>
              <span v-else :class="title_class">Lite</span>
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
  </v-container>
</template>

<script lang="ts">
import ServerMixin from '@/mixins/ServerMixin';
import {AppInfoModule} from '@/store/app_info';
import {FileID, InspecIntakeModule} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import Vue from 'vue';
import Component, {mixins} from 'vue-class-component';
import vueFileAgent from 'vue-file-agent';
import 'vue-file-agent/dist/vue-file-agent.css';

Vue.use(vueFileAgent);

interface VueFileAgentRecord {
  file: File;
}

/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component
export default class FileReader extends mixins(ServerMixin) {
  fileRecords: Array<VueFileAgentRecord> = [];
  loading = false;

  filesSelected() {
    this.loading = true;
    this.commit_files(this.fileRecords.map((record) => record.file));
    this.fileRecords = [];
  }

  /** Callback for our file reader */
  commit_files(files: File[]) {
    Promise.all(
      files.map(async (file) => {
        try {
          return await InspecIntakeModule.loadFile({file});
        } catch (err) {
          SnackbarModule.failure(String(err));
        }
      })
    )
      // Since some HDF converters can return multiple results sets, we can sometimes have multiple file IDs returned
      .then((fileIds: (FileID | FileID[] | void)[]) => {
        const allIds: FileID[] = [];
        fileIds.forEach((fileId) => {
          if (Array.isArray(fileId)) {
            allIds.push(...fileId.filter(Boolean));
          } else if (fileId) {
            allIds.push(fileId);
          }
        });
        this.$emit('got-files', allIds);
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
