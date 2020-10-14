<template>
  <v-card class="elevation-0">
    <v-card-subtitle>
      Samples to show the power of the Heimdall application and supported HDF
      formats
    </v-card-subtitle>
    <LoadFileList
      :headers="headers"
      :files="samples"
      file-key="filename"
      :loading="false"
      @load-results="load_samples($event)"
    />
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import LoadFileList from '@/components/global/upload_tabs/LoadFileList.vue';
import {FileID, InspecIntakeModule} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';

import {samples, Sample} from '@/utilities/sample_util';

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
    }
  ];

  load_samples(samples: Sample[]) {
    Promise.all(
      samples.map((sample) => {
        return InspecIntakeModule.loadText({
          text: JSON.stringify(sample.data),
          filename: sample.filename
        });
      })
    )
      .then((fileIds: FileID[]) => {
        this.$emit('got-files', fileIds);
      })
      .catch((err) => {
        SnackbarModule.failure(String(err));
      });
  }
}
</script>
