<template>
  <Modal
    :value="value"
    @input="$emit('input', $event.target.value)"
    :persistent="persistent"
  >
    <v-tabs
      :vertical="$vuetify.breakpoint.mdAndUp"
      active
      color="primary-visible"
      show-arrows
    >
      <v-tabs-slider></v-tabs-slider>
      <!-- Define our tabs -->
      <v-tab href="#uploadtab-local">Local Files</v-tab>

      <v-tab href="#uploadtab-s3">S3 Bucket</v-tab>

      <v-tab href="#uploadtab-splunk">Splunk</v-tab>
      <v-spacer />
      <v-divider />
      <v-tab href="#uploadtab-samples">Samples</v-tab>

      <!-- Include those components -->
      <v-tab-item value="uploadtab-local">
        <FileReader @got-files="got_files" />
      </v-tab-item>

      <v-tab-item value="uploadtab-samples">
        <SampleList @got-files="got_files" />
      </v-tab-item>

      <v-tab-item value="uploadtab-s3">
        <S3Reader class="pa-4" @got-files="got_files" />
      </v-tab-item>

      <v-tab-item value="uploadtab-splunk">Coming soon</v-tab-item>
    </v-tabs>
    <HelpFooter />
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import InspecIntakeModule, { FileID } from "@/store/report_intake";
import Modal from "@/components/global/Modal.vue";
import FileReader from "@/components/global/upload_tabs/FileReader.vue";
import HelpFooter from "@/components/global/upload_tabs/HelpFooter.vue";
import S3Reader from "@/components/global/upload_tabs/S3Reader.vue";
import SampleList from "@/components/global/upload_tabs/SampleList.vue";

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {
    value: Boolean, // Whether it is open. Modelable
    persistent: Boolean // Whether clicking outside closes
  }
});

/**
 * Multiplexes all of our file upload components
 * Emits "got-files" with a list of the unique_ids of the loaded files, wherever they come from
 */
@Component({
  components: {
    Modal,
    FileReader,
    HelpFooter,
    S3Reader,
    SampleList
  }
})
export default class UploadNexus extends Props {
  activeTab: Number = 0;

  // Event passthrough
  got_files(files: FileID[]) {
    this.$emit("got-files", files);
  }
}
</script>
