<template>
  <v-row class="pa-4" justify="space-between">
    <v-col cols="12">
      <strong>Filename:</strong> {{ filename }}<br />
      <strong>Tool Version:</strong> {{ inspec_version }}<br />
      <strong>Platform:</strong> {{ platform }}<br />
      <strong>Duration:</strong> {{ get_duration }}<br />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {InspecDataModule} from '@/store/data_store';
import {FilteredDataModule} from '@/store/data_filters';
import {FileID, EvaluationFile} from '@/store/report_intake';

import {Prop} from 'vue-property-decorator';

@Component
export default class EvaluationInfo extends Vue {
  @Prop({required: true}) readonly file_filter!: FileID;

  version: string | null = null;
  platform_name: string | null = null;
  platform_release: string | null = null;
  duration: number | null | undefined = null;
  database_id: number | null = null;

  created() {
    this.load_file();
  }

  updated() {
    let file = InspecDataModule.allFiles.find(
      (f) => f.unique_id === this.file_filter
    );
    if (file && file.hasOwnProperty('evaluation')) {
      let eva = file as EvaluationFile;
      this.version = eva.evaluation.data.version;
      this.platform_name = eva.evaluation.data.platform.name;
      this.platform_release = eva.evaluation.data.platform.release;
      this.duration = eva.evaluation.data.statistics.duration;
      this.database_id = eva.database_id || null;
    }
  }

  get filename(): string {
    return this.file.filename;
  }

  get inspec_version(): string {
    return this.file.evaluation.data.version;
  }

  get platform(): string {
    return (
      this.file.evaluation.data.platform.name +
      this.file.evaluation.data.platform.release
    );
  }

  get get_duration(): string {
    return this.file.evaluation.data.statistics.duration + '';
  }

  //gets file to retrieve corresponding data
  get file(): EvaluationFile {
    return FilteredDataModule.evaluations([this.file_filter])[0].from_file;
  }

  load_file() {
    let file = InspecDataModule.allFiles.find(
      (f) => f.unique_id === this.file_filter
    );
    if (file && file.hasOwnProperty('evaluation')) {
      let eva = file as EvaluationFile;
      this.version = eva.evaluation.data.version;
      this.platform_name = eva.evaluation.data.platform.name;
      this.platform_release = eva.evaluation.data.platform.release;
      this.duration = eva.evaluation.data.statistics.duration;
    }
  }
}
</script>
