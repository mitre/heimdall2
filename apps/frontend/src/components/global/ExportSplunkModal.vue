<template>
  <v-dialog v-model="showingModal" width="800px">
    <template #activator="{on}">
      <LinkItem
        key="export_splunk"
        text="Export to Splunk"
        icon="mdi-database-arrow-up"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export to Splunk </v-card-title>
      <v-card-text>
        <v-stepper v-model="step" class="elevation-0">
          <v-stepper-header class="elevation-0">
            <v-stepper-step id="step-1" step="1">
              Login Credentials
            </v-stepper-step>
            <v-divider />
            <v-stepper-step id="step-2" step="2"> Post Data </v-stepper-step>
          </v-stepper-header>
          <v-stepper-items>
            <v-stepper-content step="1">
              <AuthStep
                index-to-show=""
                @authenticated="onAuthenticationComplete"
                @error="errorCount += 1"
                @show-help="errorCount = -1"
              />
            </v-stepper-content>
            <v-stepper-content step="2">
              <pre v-text="statusLog" />
            </v-stepper-content>
          </v-stepper-items>
          <v-overlay
            :opacity="50"
            absolute="absolute"
            :value="errorCount >= 3 || errorCount < 0"
          >
            <div class="text-left">
              <p>
                <span v-if="errorCount > 0">
                  It seems you may be having trouble using the Splunk toolkit.
                  Are you sure that you have configured it properly?
                </span>
                <br />
                <span>
                  Accessing a Splunk instance from Heimdall requires the input
                  of the following information:
                  <br />
                  username: A qualified username recognized by the referenced
                  Splunk instance.
                  <br />
                  password: A qualified password recognized by the referenced
                  Splunk instance.
                  <br />
                  hostname: The domain name for the desired Splunk instance.
                  Include port number if available.
                  <br />
                  index: A valid index name within the referenced Splunk
                  instance.
                  <br />
                  For installation instructions and further information, see:
                </span>
                <v-btn
                  target="_blank"
                  href="https://github.com/mitre/heimdall2/wiki/Heimdall-Interface-Connections"
                  text
                  color="info"
                  px-0
                >
                  <v-icon pr-2>mdi-github-circle</v-icon>
                  Splunk Interfacing Guide
                </v-btn>
              </p>
              <v-btn color="info" @click="errorCount = 0"> Ok </v-btn>
            </div>
          </v-overlay>
        </v-stepper>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {FilteredDataModule} from '@/store/data_filters';
import {FileID} from '@/store/report_intake';
import {FromHDFToSplunkMapper} from '@mitre/hdf-converters';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Logger} from 'winston';
import {SnackbarModule} from '../../store/snackbar';
import AuthStep from '../global/upload_tabs/splunk/AuthStep.vue';
import {SplunkConfig} from '@mitre/hdf-converters/types/splunk-config-types';

@Component({
  components: {
    AuthStep,
    LinkItem
  }
})
export default class ExportSplunkModal extends Vue {
  showingModal = false;
  step = 1;
  errorCount = 0;
  statusLog = '';
  splunkConfig: SplunkConfig | null = null;

  logger: unknown = {
    info: this.addLogMessage,
    debug: this.addLogMessage,
    verbose: this.addLogMessage,
    error: this.addLogMessage
  };

  addLogMessage(message: string) {
    this.statusLog += message + '\n';
  }

  closeModal() {
    this.showingModal = false;
    this.step = 1;
    this.statusLog = '';
    this.splunkConfig = null;
  }

  showModal() {
    this.showingModal = true;
  }

  onAuthenticationComplete(splunkConfig: SplunkConfig) {
    this.splunkConfig = splunkConfig;
    this.step = 2;
    this.convertAndUpload();
  }

  got_files(files: FileID[]) {
    this.$emit('got-files', files);
  }

  onSignOut() {
    this.step = 1;
    this.splunkConfig = null;
  }

  async convertAndUpload() {
    const ids = FilteredDataModule.selected_file_ids;
    FilteredDataModule.evaluations(ids).forEach(async (evaluation) => {
      this.statusLog += `Starting Upload of File: ${evaluation.from_file.filename}\n`;
      if (this.splunkConfig) {
        new FromHDFToSplunkMapper(evaluation, this.logger as Logger)
          .toSplunk(this.splunkConfig, evaluation.from_file.filename)
          .then(() => {
            this.statusLog += `Sucessfully uploaded file ${evaluation.from_file.filename}\n`;
          })
          .catch((error) => {
            this.statusLog += `Failed to upload file ${evaluation.from_file.filename}:\n\t${error}\n`;
          });
      } else {
        SnackbarModule.failure(
          'Failed to upload to Splunk: Invalid Configuration (undefined)'
        );
      }
    });
  }
}
</script>
