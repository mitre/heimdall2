<template>
  <v-container>
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <UploadNexus
          :value="dialog"
          @got-files="on_got_files"
          :persistent="true"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import UploadNexus from "@/components/global/UploadNexus.vue";

import { Filter, NistMapState } from "@/store/data_filters";
import { FileID } from "@/store/report_intake";

// We declare the props separately
// to make props types inferrable.
const LandingProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    UploadNexus
  }
})
export default class Landing extends LandingProps {
  /** Whether or not the model is showing */
  dialog: boolean = true;

  /**
   * Invoked when file(s) are loaded.
   */
  on_got_files(ids: FileID[]) {
    // Close the dialog
    this.dialog = false;

    // If just one file, focus it
    if (ids.length === 1) {
      this.$router.push(`/results/${ids[0]}`);
    }

    // If more than one, focus all.
    // TODO: Provide support for focusing a subset of files
    else if (ids.length > 1) {
      this.$router.push(`/results/all`);
    }
  }
}
</script>
