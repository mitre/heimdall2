<template>
  <v-stepper v-model="step">
    <v-stepper-header class="elevation-0">
      <v-stepper-step id="step-1" step="1">
        Tenable Authorization
      </v-stepper-step>
      <v-divider />
      <v-stepper-step id="step-2" step="2">
        Search Scan Results
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
          v-if="tenableConfig"
          :tenable-config="tenableConfig"
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
          <span v-if="errorCount > 0" style="color: red; font-weight: bold">
            It seems you may be having trouble connecting to Tenable.sc. Ensure
            <br />
            that the access key, secret key, and host url are properly
            configured.
          </span>
          <br />
          <span>
            For connection instructions and further information, consult:
          </span>
          <v-btn
            target="_blank"
            href="https://github.com/mitre/heimdall2#tenablesc"
            text
            color="info"
            px-0
          >
            <v-icon pr-2>mdi-github-circle</v-icon>
            Tenable Configuration
          </v-btn>
          <br />
          <span>
            API key authorization requires Tenable.sc 5.13.x or later.
            <br />
            A unique set of API keys can be generated for each user account.
            <br />
            The API authorization keys serve as a user authentication token.
          </span>
        </p>
        <v-btn color="info" @click="errorCount = 0"> Ok </v-btn>
      </div>
    </v-overlay>
  </v-stepper>
</template>
<script lang="ts">
import {FileID} from '@/store/report_intake';
import Vue from 'vue';
import Component from 'vue-class-component';
import AuthStep from './AuthStep.vue';
import FileList from './FileList.vue';
import {AuthInfo} from '@/utilities/tenable_util';

@Component({
  components: {
    AuthStep,
    FileList
  }
})
export default class TenableReader extends Vue {
  step = 1;
  errorCount = 0;
  tenableConfig: AuthInfo | null = null;

  onAuthenticationComplete(tenableConfig: AuthInfo) {
    this.tenableConfig = tenableConfig;
    this.step = 2;
  }

  got_files(files: FileID[]) {
    this.$emit('got-files', files);
  }

  onSignOut() {
    this.step = 1;
    this.tenableConfig = null;
  }
}
</script>
