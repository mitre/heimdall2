<template>
  <div>
    <Modal
      :visible="visible"
      :persistent="persistent"
      @close-modal="$emit('close-modal')"
    >
      <v-banner v-if="warning_banner" icon="mdi-alert" color="warning">
        {{ warning_banner }}
      </v-banner>
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
        <v-tab id="select-tab-local" href="#uploadtab-local">Local Files</v-tab>

        <v-tab
          v-if="serverMode"
          id="select-tab-database"
          href="#uploadtab-database"
          >Database</v-tab
        >

        <v-tab id="select-tab-s3" href="#uploadtab-s3">S3 Bucket</v-tab>

        <v-tab id="select-tab-splunk" href="#uploadtab-splunk">Splunk</v-tab>

        <v-spacer />
        <v-divider />
        <v-tab id="sample_tab" href="#uploadtab-samples">Samples</v-tab>

        <!-- Include those components -->
        <v-tab-item value="uploadtab-local">
          <FileReader @got-files="got_files" />
        </v-tab-item>

        <v-tab-item v-if="serverMode" value="uploadtab-database">
          <DatabaseReader :refresh="visible" @got-files="got_files" />
        </v-tab-item>

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
import Component, {mixins} from 'vue-class-component';
import {FileID} from '@/store/report_intake';
import Modal from '@/components/global/Modal.vue';
import FileReader from '@/components/global/upload_tabs/FileReader.vue';
import HelpFooter from '@/components/global/upload_tabs/HelpFooter.vue';
import S3Reader from '@/components/global/upload_tabs/aws/S3Reader.vue';
import SplunkReader from '@/components/global/upload_tabs/splunk/SplunkReader.vue';
import DatabaseReader from '@/components/global/upload_tabs/DatabaseReader.vue';
import SampleList from '@/components/global/upload_tabs/SampleList.vue';
import {LocalStorageVal} from '@/utilities/helper_util';
import {SnackbarModule} from '@/store/snackbar';
import ServerMixin from '@/mixins/ServerMixin';
import RouteMixin from '@/mixins/RouteMixin';
import {Prop} from 'vue-property-decorator';
import {ServerModule} from '@/store/server';
import {FilteredDataModule} from '@/store/data_filters';

const local_tab = new LocalStorageVal<string>('nexus_curr_tab');

/**
 * Multiplexes all of our file upload components
 * Emits "got-files" with a list of the unique_ids of the loaded files, wherever they come from
 */
@Component({
  components: {
    Modal,
    DatabaseReader,
    FileReader,
    HelpFooter,
    S3Reader,
    SplunkReader,
    SampleList
  }
})
export default class UploadNexus extends mixins(ServerMixin, RouteMixin) {
  @Prop({default: true}) readonly visible!: Boolean;
  @Prop({default: false}) readonly persistent!: Boolean;

  active_tab: string = local_tab.get_default('uploadtab-local');

  // Handles change in tab
  selected_tab(new_tab: string) {
    this.active_tab = new_tab;
    SnackbarModule.visibility(false);
    local_tab.set(new_tab);
  }

  get warning_banner(): string {
    return ServerModule.banner;
  }

  // Event passthrough
  got_files(files: FileID[]) {
    this.$emit('got-files', files);

    let numEvaluations = FilteredDataModule.selectedEvaluationIds.filter(
      (eva) => files.includes(eva)
    ).length;
    let numProfiles = FilteredDataModule.selectedProfileIds.filter((prof) =>
      files.includes(prof)
    ).length;

    if (numEvaluations > numProfiles) {
      this.navigateUnlessActive('/results');
    } else {
      this.navigateUnlessActive('/profiles');
    }
  }
}
</script>

<style lang="scss" scoped>
.theme--dark.v-tabs {
  background: var(--v-secondary-lighten1);
}
</style>
