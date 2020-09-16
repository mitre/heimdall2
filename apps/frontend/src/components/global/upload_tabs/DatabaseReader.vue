<template>
  <v-card class="elevation-0">
    <v-card-subtitle>
      View files loaded into your organizations Heimdall Server instance.
    </v-card-subtitle>
    <LoadFileList
      :headers="headers"
      :files="files"
      :loading="loading"
      @load_results="load_results($event)"
    />
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import LoadFileList from '@/components/global/upload_tabs/LoadFileList.vue';

import axios from 'axios';

import {FileID, InspecIntakeModule} from '@/store/report_intake';

import {IEvaluation} from '@heimdall/interfaces';

/**
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {
    LoadFileList
  }
})
export default class DatabaseReader extends Vue {
  files: IEvaluation[] = [];
  loading: boolean = true;

  headers: Object[] = [
    {
      text: 'Filename',
      align: 'start',
      sortable: true,
      value: 'filename'
    },
    {text: 'Uploaded', value: 'createdAt', sortable: true}
  ];

  mounted() {
    this.get_all_results();
  }

  get_all_results(): void {
    axios.get<IEvaluation[]>('/evaluations').then(response => {
      this.files = response.data;
      this.loading = false;
    });
  }

  load_results(evaluations: IEvaluation[]): void {
    Promise.all(
      evaluations.map(evaluation => {
        return InspecIntakeModule.loadText({
          text: JSON.stringify(evaluation.data),
          filename: evaluation.filename,
          database_id: evaluation.id,
          createdAt: evaluation.createdAt,
          updatedAt: evaluation.updatedAt,
          tags: [] // Tags are not yet implemented, so for now the value is passed in empty
        }).catch(err => {
          this.$toasted.global.error({
            message: err
          });
        });
      })
    ).then((fileIds: (FileID | void)[]) => {
      this.$emit('got-files', fileIds.filter(Boolean));
    });
  }
}
</script>
