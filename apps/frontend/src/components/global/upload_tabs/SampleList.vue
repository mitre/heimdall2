<template>
  <v-card>
    <v-list two-line>
      <v-list-item v-for="(sample, index) in samples" :key="index">
        <v-list-item-content>
          <v-list-item-title v-text="sample.name" />
          <v-list-item-subtitle v-text="sample.description" />
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

interface Sample {
  name: string;
  description: string;
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
  samples: Sample[] = [
    {
      name: "RHEL-7 Output",
      description: "It is some rhel7 stuff!",
      url:
        "https://raw.githubusercontent.com/mitre/inspec-samples/master/json/results/rhel-7-output.json"
    }
  ];

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
