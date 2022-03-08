<template>
  <v-stepper v-model="step">
    <v-stepper-header class="elevation-0">
      <v-stepper-step id="step-1" step="1"> Login Credentials </v-stepper-step>
      <v-divider />
      <v-stepper-step id="step-2" step="2">
        Search Execution Events
      </v-stepper-step>
    </v-stepper-header>
    <v-stepper-items>
      <v-stepper-content step="1">
        <AuthStep
          @authenticated="onAuthenticationComplete"
          @error="errorCount += 1"
          @show-help="errorCount = -1"
        />
      </v-stepper-content>
      <v-stepper-content step="2">
        <FileList
          v-if="splunkClient"
          :splunk-client="splunkClient"
          @signOut="onSignOut"
          @got-files="got_files"
        />
      </v-stepper-content>
    </v-stepper-items>
    <v-overlay
      :opacity="50"
      absolute="absolute"
      :value="errorCount >= 3 || errorCount < 0"
    >
      <div class="text-center">
        <p>
          <span v-if="errorCount > 0">
            It seems you may be having trouble using the Splunk toolkit. Are you
            sure that you have configured it properly?
          </span>
          <br />
          <span>
            For installation instructions and further information, check here:
          </span>
          <v-btn
            target="_blank"
            href="https://github.com/mitre/hdf-json-to-splunk/"
            text
            color="info"
            px-0
          >
            <v-icon pr-2>mdi-github-circle</v-icon>
            Splunk HDF Plugin
          </v-btn>
        </p>
        <v-btn color="info" @click="errorCount = 0"> Ok </v-btn>
      </div>
    </v-overlay>
  </v-stepper>
</template>
<script lang="ts">
import {FileID} from '@/store/report_intake';
import {SplunkClient} from '@/utilities/splunk_util';
import Vue from 'vue';
import Component from 'vue-class-component';
import AuthStep from './AuthStep.vue';
import FileList from './FileList.vue';
@Component({
  components: {
    AuthStep,
    FileList
  }
})
export default class SplunkReader extends Vue {
  step = 1;
  errorCount = 0;
  splunkClient: SplunkClient | null = null;

  onAuthenticationComplete(splunkClient: SplunkClient) {
    this.splunkClient = splunkClient;
    this.step = 2;
  }

  got_files(files: FileID[]) {
    this.$emit('got-files', files);
  }

  onSignOut() {
    this.step = 1;
    this.splunkClient = null;
  }
}
</script>
