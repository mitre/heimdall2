<template>
  <v-card class="elevation-0">
    <v-card-subtitle>
      Samples to show the power of the Heimdall application and supported HDF
      formats
    </v-card-subtitle>
    <v-container class="mx-0 px-0">
      <LoadFileList
        :headers="headers"
        :files="samples"
        file-key="filename"
        sort-by="filename"
        :sort-desc="false"
        :loading="loading"
        @load-results="load_samples($event)"
      />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import LoadFileList from '@/components/global/upload_tabs/LoadFileList.vue';
import {FileID, InspecIntakeModule} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {Sample, samples, fetchSample} from '@/utilities/sample_util';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {
    LoadFileList
  }
})
export default class SampleList extends Vue {
  samples: Sample[] = samples;
  headers: Object[] = [
    {
      text: 'Filename',
      align: 'start',
      sortable: true,
      value: 'filename'
    },
    {
      text: 'Type',
      value: 'fingerprint',
      sortable: true
    }
  ];

  loading = false;

  load_samples(selectedSamples: Sample[]) {
    const promises: Promise<FileID | FileID[]>[] = []
    this.loading = true;
    for (const sample of selectedSamples) {
      const requestFile = fetchSample(sample).then((data: File) => {
        return InspecIntakeModule.loadFile({
          file: data,
          filename: sample.filename
        });
      })
      promises.push(requestFile);
    }

    Promise.all(promises)
      .then((fileIds: (FileID | FileID[])[]) => {
        this.$emit('got-files', fileIds.flat(2));
      })
      .catch((error) => {
        SnackbarModule.failure(String(error));
      })
      .finally(() => {
        this.loading = false;
      });
  }
}
</script>
