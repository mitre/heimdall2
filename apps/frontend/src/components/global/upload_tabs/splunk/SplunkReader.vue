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
          v-if="splunkConfig"
          :splunk-config="splunkConfig"
          @signOut="onSignOut"
          @got-files="gotFiles"
        />
      </v-stepper-content>
    </v-stepper-items>
    <v-overlay
      :opacity="50"
      absolute="absolute"
      :value="errorCount >= 3 || errorCount < 0"
    >
      <div class="text-left">
        <p>
          <span v-if="errorCount > 0" style="color: red; font-weight: bold">
            It seems you may be having trouble connecting to Splunk. Are you
            sure that you have configured it properly?
          </span>
          <br />
          <span>
            For installation instructions and further information, check:
          </span>
          <v-btn
            target="_blank"
            href="https://github.com/mitre/saf/wiki/Splunk-Configuration"
            text
            color="info"
            px-0
          >
            <v-icon pr-2>mdi-github-circle</v-icon>
            Splunk Configuration
          </v-btn>
          <br />
          <span>
            The Splunk platform accepts any type of data. In particular, it
            works with all IT streaming
            <br />
            and historical data. The source of the data can be event logs, web
            logs, live application logs,
            <br />
            network feeds, system metrics, change monitoring, message queues,
            archive files, and so on.
          </span>
          <br />
          <span>
            <br />
            "A Splunk index is a repository for Splunk data."
            <br />
            Data that has not been previously added to Splunk is referred to as
            raw data.
            <br />
            When the data is added to Splunk, it indexes the data (uses the data
            to update its indexes),
            <br />
            creating event data. Individual units of this data are called
            events.
          </span>
        </p>
        <v-btn color="info" @click="errorCount = 0"> Ok </v-btn>
      </div>
    </v-overlay>
  </v-stepper>
</template>

<script lang="ts">
import {FileID} from '@/store/report_intake';
import {SplunkConfigNoIndex} from '@mitre/hdf-converters/src/splunk-mapper';
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
  splunkConfig: SplunkConfigNoIndex | null = null;

  onAuthenticationComplete(splunkConfig: SplunkConfigNoIndex) {
    this.splunkConfig = splunkConfig;
    this.step = 2;
  }

  gotFiles(files: FileID[]) {
    this.$emit('got-files', files);
  }

  onSignOut() {
    this.step = 1;
    this.splunkConfig = null;
  }
}
</script>
