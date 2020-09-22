<template>
  <div>
    <Modal
      :value="value"
      :persistent="persistent"
      @input="$emit('input', $event.target.value)"
    >
      <v-tabs
        :vertical="$vuetify.breakpoint.mdAndUp"
        active
        :value="active_tab"
        color="primary-visible"
        show-arrows
        @change="selected_tab"
      >
        <v-tabs-slider />
        <!-- Define our tabs -->
        <v-tab id="local_files_tab" href="#uploadtab-local">Local Files</v-tab>

        <v-tab href="#uploadtab-s3">S3 Bucket</v-tab>

        <v-tab href="#uploadtab-splunk">Splunk</v-tab>
        <v-spacer />
        <v-divider />
        <v-tab id="sample_tab" href="#uploadtab-samples">Samples</v-tab>

        <!-- Include those components -->
        <v-tab-item value="uploadtab-local">
          <FileReader @got-files="got_files" />
        </v-tab-item>

        <!--v-tab-item value="uploadtab-database">
          <DatabaseReader @got-files="got_files" />
        </v-tab-item-->

        <v-tab-item value="uploadtab-samples">
          <SampleList @got-files="got_files" />
        </v-tab-item>

        <v-tab-item value="uploadtab-s3">
          <S3Reader @got-files="got_files" />
        </v-tab-item>

        <v-tab-item value="uploadtab-splunk">
          <SplunkReader @got-files="got_files" />
        </v-tab-item>
      </v-tabs>
      <HelpFooter />
    </Modal>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {FileID} from '@/store/report_intake';
import Modal from '@/components/global/Modal.vue';
import FileReader from '@/components/global/upload_tabs/FileReader.vue';
import HelpFooter from '@/components/global/upload_tabs/HelpFooter.vue';
import S3Reader from '@/components/global/upload_tabs/aws/S3Reader.vue';
import SplunkReader from '@/components/global/upload_tabs/splunk/SplunkReader.vue';
import SampleList from '@/components/global/upload_tabs/SampleList.vue';
import {LocalStorageVal} from '@/utilities/helper_util';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';

const local_tab = new LocalStorageVal<string>('nexus_curr_tab');

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
    SplunkReader,
    SampleList
  }
})
export default class UploadNexus extends Props {
  active_tab: string = local_tab.get_default('uploadtab-local');

  // Handles change in tab
  selected_tab(new_tab: string) {
    this.active_tab = new_tab;
    this.$toasted.clear();
    local_tab.set(new_tab);
  }

  // Event passthrough
  got_files(files: FileID[]) {
    this.$emit('got-files', files);

    for (let f of files) {
      FilteredDataModule.set_toggle_file_on(f);
    }

    if (
      InspecDataModule.allProfileFiles.length > 0 &&
      InspecDataModule.allEvaluationFiles.length === 0
    )
      this.$router.push(`/profiles`);
    else this.$router.push(`/results`);
  }
}
</script>
