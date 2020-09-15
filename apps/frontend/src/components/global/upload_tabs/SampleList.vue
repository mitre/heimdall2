<template>
  <v-card class="elevation-0">
    <v-card-subtitle>
      Samples to show the power of the Heimdall application and supported HDF
      formats
    </v-card-subtitle>
    <v-list max-height="434" style="overflow-y:scroll;">
      <v-list-item v-for="(sample, index) in samples" :key="index" class="mx-2">
        <v-list-item-content>
          <v-list-item-title v-text="sample.name" />
        </v-list-item-content>
        <v-list-item-action @click="select_samp(sample)">
          <v-checkbox color="blue" :input-value="selected(sample)" />
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-btn block class="px-2" @click="load_selected_samps">
      Load
      <v-icon class="pl-2"> mdi-file-upload</v-icon>
    </v-btn>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import {InspecIntakeModule, next_free_file_ID} from '@/store/report_intake';

import {samples, Sample} from '@/utilities/sample_util';

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
  selected_samps: Sample[] = [];

  get samples(): Sample[] {
    return samples;
  }

  selected(samp: Sample): boolean {
    return this.selected_samps.includes(samp);
  }

  /** Callback for our list item clicks */
  load_sample(sample: Sample) {
    let unique_id = next_free_file_ID();
    return InspecIntakeModule.loadText({
      text: JSON.stringify(sample.sample),
      filename: sample.name,
      unique_id
    }).then(err => {
      if (err) {
        console.error(`Error loading sample ${sample.name}`);
        this.$toasted.global.error({
          message: String(err),
          isDark: this.$vuetify.theme.dark
        });
      } else {
        this.$emit('got-files', [unique_id]);
      }
    });
  }

  load_selected_samps() {
    for (let samp of this.selected_samps) {
      this.load_sample(samp);
    }
    this.selected_samps = [];
  }

  select_samp(samp: Sample) {
    let checked = this.selected_samps.indexOf(samp);
    // If the sample is currently checked then this is a toggle to uncheck it
    // indexOf returns -1 if the element is not in the list
    if (checked != -1) {
      this.selected_samps.splice(checked, 1);
    } // Otherwise this is a toggle to check it, added to the selected samples list
    else {
      this.selected_samps.push(samp);
    }
  }
}
</script>
