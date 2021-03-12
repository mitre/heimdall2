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
      :loading="loading"
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

  loading = false;

  load_samples(samples: Sample[]) {
    this.loading = true;
    Promise.all(
      samples.map((sample) => {
        return sample.data().then((data: JSON) => {
          return InspecIntakeModule.loadText({
            text: JSON.stringify(data),
            filename: sample.filename
          });
        });
      })
    )
      .then((fileIds: FileID[]) => {
        this.$emit('got-files', fileIds);
        this.loading = false;
      })
      .catch((err) => {
        SnackbarModule.failure(String(err));
        this.loading = false;
      });
  }
}
</script>
