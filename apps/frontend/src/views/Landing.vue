<template>
  <BaseView>
    <template #main-content>
      <v-tabs
        active
        class="pt-0 mt-0"
        :value="activeTab"
        color="primary-visible"
        show-arrows
        @change="selectedTab"
      >
        <!-- Define our available tabs -->
        <v-tab id="select-tab-local" href="#uploadtab-local">Local Files</v-tab>
        <v-tab
          v-if="serverMode"
          id="select-tab-database"
          href="#uploadtab-database"
          >Database</v-tab
        >
        <v-tab id="select-tab-s3" href="#uploadtab-s3">S3 Bucket</v-tab>
        <v-tab id="select-tab-splunk" href="#uploadtab-splunk">Splunk</v-tab>
        <v-tab id="select-tab-sample" href="#uploadtab-sample">Samples</v-tab>

        <!-- Then define the tabs themselves -->
        <v-tab-item value="uploadtab-local">
          <FileReader ref="fileReader" @got-files="gotFiles" />
        </v-tab-item>

        <v-tab-item v-if="serverMode" value="uploadtab-database">
          <DatabaseReader :refresh="false" @got-files="gotFiles" />
        </v-tab-item>

        <v-tab-item value="uploadtab-s3">
          <S3Reader @got-files="gotFiles" />
        </v-tab-item>

        <v-tab-item value="uploadtab-splunk">
          <SplunkReader @got-files="gotFiles" />
        </v-tab-item>

        <v-tab-item value="uploadtab-sample">
          <SampleList @got-files="gotFiles" />
        </v-tab-item>
      </v-tabs>
    </template>
  </BaseView>
</template>
<script lang="ts">
import Component, {mixins} from 'vue-class-component';
import BaseView from '@/views/BaseView.vue';
import ServerMixin from '../mixins/ServerMixin';
import RouteMixin from '../mixins/RouteMixin';
import {LocalStorageVal} from '../utilities/helper_util';
import FileReader from '@/components/global/upload_tabs/FileReader.vue';
import DatabaseReader from '@/components/global/upload_tabs/DatabaseReader.vue';
import SampleList from '@/components/global/upload_tabs/SampleList.vue';
import S3Reader from '@/components/global/upload_tabs/aws/S3Reader.vue';
import SplunkReader from '@/components/global/upload_tabs/splunk/SplunkReader.vue';
import {SnackbarModule} from '../store/snackbar';
import {FileID} from '../store/report_intake';
import {FilteredDataModule} from '../store/data_filters';
import {InspecDataModule} from '../store/data_store';
const localTab = new LocalStorageVal<string>('nexus_curr_tab');


@Component({
  components: {
    BaseView,
    DatabaseReader,
    FileReader,
    SampleList,
    S3Reader,
    SplunkReader
  }
})
export default class Landing extends mixins(ServerMixin, RouteMixin) {
  activeTab = localTab.get_default('uploadtab-local');

  // Handles change in tab
  selectedTab(newTab: string) {
    this.activeTab = newTab;
    SnackbarModule.visibility(false);
    localTab.set(newTab);
  }

  // Event passthrough
  gotFiles(files: FileID[]) {
    this.$emit('got-files', files);

    const numEvaluations = FilteredDataModule.selectedEvaluationIds.filter(
      (eva) => files.includes(eva)
    ).length;
    const numProfiles = FilteredDataModule.selectedProfileIds.filter((prof) =>
      files.includes(prof)
    ).length;

    const loadedDatabaseIds = InspecDataModule.loadedDatabaseIds.join(',');
    if (numEvaluations >= numProfiles) {
      // Only navigate the user to the results page if they are not
      // already on the compare page.
      if (this.current_route === 'compare') {
        this.navigateWithNoErrors(`/compare/${loadedDatabaseIds}`);
      } else {
        this.navigateWithNoErrors(`/results/${loadedDatabaseIds}`);
      }
    } else {
      this.navigateWithNoErrors(`/profiles/${loadedDatabaseIds}`);
    }
  }
}
</script>
