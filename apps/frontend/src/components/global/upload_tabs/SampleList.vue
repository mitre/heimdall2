<template>
  <v-card class="elevation-0">
    <v-card-subtitle>
      Samples to show the power of the Heimdall application and supported HDF
      formats
    </v-card-subtitle>
    <v-list>
      <v-list-item v-for="(sample, index) in samples" :key="index">
        <v-list-item-content>
          <v-list-item-title v-text="sample.name" />
        </v-list-item-content>
        <v-list-item-action>
          <v-btn icon @click="load_sample(sample)">
            <v-icon>mdi-plus-circle</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import { defined } from "@/utilities/async_util";
import InspecIntakeModule, {
  FileID,
  next_free_file_ID
} from "@/store/report_intake";
import InspecDataModule from "../../../store/data_store";
import AppInfoModule from "../../../store/app_info";

interface Sample {
  name: string;
  url: string;
}

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
  components: {}
})
export default class SampleList extends Props {
  get samples(): Sample[] {
    return [
      {
        name: "Sonarqube Java Heimdall_tools Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/sonarqube_java_sample.json`
      },
      {
        name: "OWASP ZAP Webgoat Heimdall_tools Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/owasp_zap_webgoat.json`
      },
      {
        name: "OWASP ZAP Zero_WebAppSecurity Heimdall_tools Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/owasp_zap_zero.webappsecurity.json`
      },
      {
        name: "Fortify Heimdall_tools Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/fortify_h_tools_conv_webgoat.json`
      },
      {
        name: "AWS S3 Permissions Check InSpec Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/aws-s3-baseline.json`
      },
      {
        name: "AWS CIS Foundations Baseline InSpec Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/cis-aws-foundations-baseline.json`
      },
      {
        name: "NGINX Inspec Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/good_nginxresults.json`
      },
      {
        name: "Red Hat CVE Vulnerability Scan InSpec Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/rhel_cve_vulnerability_scan_baseline_with_failures.json`
      },
      {
        name: "RedHat 7 STIG Baseline InSpec Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/rhel7-results.json`
      },
      {
        name: "Ubuntu STIG Baseline InSpec Sample",
        url: `https://raw.githubusercontent.com/${this.repo}/master/samples/ubuntu-16.04-baseline-results.json`
      }
    ];
  }

  get repo(): string {
    let mod = getModule(AppInfoModule, this.$store);
    return `${mod.repo_org}/${mod.repo_name}`;
  }

  /** Callback for our list item clicks */
  load_sample(sample: Sample) {
    // Generate an id
    let unique_id = next_free_file_ID();

    // Get intake module
    let intake_module = getModule(InspecIntakeModule, this.$store);
    // Do fetch
    fetch(sample.url, { method: "get" })
      .then(response => response.text())
      .then(text =>
        intake_module.loadText({ filename: sample.name, unique_id, text })
      )
      .then(err => {
        // Handle errors if necessary
        if (err) {
          throw `Error loading sample ${sample.name}`;
        } else {
          // Emit success
          this.$emit("got-files", [unique_id]);
        }
      })
      .catch(err => {
        // Toast whatever error we got
        this.$toasted.global.error({
          message: String(err),
          isDark: this.$vuetify.theme.dark
        });
      });
  }
}
</script>
