<template>
  <v-stepper v-model="step">
    <v-stepper-header class="elevation-0">
      <v-stepper-step step="1"> Login Credentials </v-stepper-step>
      <v-divider />
      <v-stepper-step step="2"> Search Execution Events </v-stepper-step>
    </v-stepper-header>
    <v-stepper-items>
      <v-stepper-content step="1">
        <AuthStep @authenticated="onAuthenticationComplete" />
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
