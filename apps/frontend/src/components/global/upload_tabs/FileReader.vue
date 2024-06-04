<template>
  <v-container fluid>
    <v-card style="position: relative" class="elevation-0">
      <v-sheet class="d-flex bg-surface-variant">
        <v-sheet class="me-auto">
          <v-card-subtitle>
            Easily load any supported Data Format
          </v-card-subtitle>
        </v-sheet>
        <v-sheet class="pr-1 pt-2 primary--text">Supported Formats:</v-sheet>
        <v-sheet>
          <v-btn
            class="pa-3 pt-4"
            icon
            small
            style="cursor: pointer"
            @click="isActiveDialog = true"
          >
            <v-icon
              b-tooltip.hover
              title="Heimdall Supported Formats"
              color="primary"
            >
              mdi-information-outline
            </v-icon>
          </v-btn>
          <v-dialog v-model="isActiveDialog" width="500">
            <v-card>
              <v-card-title>Heimdall Supported Formats</v-card-title>
              <v-card-text class="text-h7">
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

                <v-card-text>
                  For formats not supported please contact us at
                  <a
                    href="mailto:opensource@mitre.org?subject=Request Additional Format Support"
                    >Request Additional Formats</a
                  >
                </v-card-text>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn @click="isActiveDialog = false">Close Dialog</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-sheet>
      </v-sheet>
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
                  :help-text="'Choose file(s) to upload or drag & drop here'"
                  @select="filesSelected"
                />
              </div>
              <div v-else>
                <v-progress-circular
                  indeterminate
                  color="#ff5600"
                  :size="120"
                  :width="15"
                >
                  <template #default>
                    <b>{{ percent }}% loaded</b>
                  </template>
                </v-progress-circular>
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
  percent = 0;
  isActiveDialog = false;

  filesSelected() {
    this.loading = true;
    this.commit_files(this.fileRecords.map((record) => record.file));
    this.fileRecords = [];
  }

  /** Callback for our file reader */
  commit_files(files: File[]) {
    const totalFiles = files.length;
    let index = 1;
    document.body.style.cursor = 'wait';
    Promise.all(
      files.map(async (file) => {
        try {
          const fileId = await InspecIntakeModule.loadFile({file});
          this.percent = Math.floor((index++ / totalFiles) * 100);
          return fileId;
        } catch (err) {
          SnackbarModule.failure(String(err));
          document.body.style.cursor = 'default';
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
        this.percent = 0;
        document.body.style.cursor = 'default';
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
