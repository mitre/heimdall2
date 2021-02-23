<template>
  <v-card class="elevation-0">
    <v-container class="ma-0 pa-0">
      <v-row>
        <v-col cols="11">
          <v-card-subtitle>
            View files loaded into your organizations Heimdall Server instance.
          </v-card-subtitle>
        </v-col>
        <v-col cols="1" class="text-right">
          <RefreshButton @updateEvaluations="get_all_results"
        /></v-col>
      </v-row>
    </v-container>
    <LoadFileList
      :headers="headers"
      :files="files"
      :loading="loading"
      @updateEvaluations="get_all_results"
      @load-results="load_results($event)"
    />
  </v-card>
</template>

<script lang="ts">
import Component, {mixins} from 'vue-class-component';
import LoadFileList from '@/components/global/upload_tabs/LoadFileList.vue';
import {SnackbarModule} from '@/store/snackbar';
import {EvaluationModule} from '@/store/evaluations';
import RefreshButton from '@/components/generic/RefreshButton.vue';

import axios from 'axios';

import {FileID, InspecIntakeModule} from '@/store/report_intake';

import {IEvaluation} from '@heimdall/interfaces';
import ServerMixin from '@/mixins/ServerMixin';
import {Prop, Watch} from 'vue-property-decorator';

/**
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {
    LoadFileList,
    RefreshButton
  }
})
export default class DatabaseReader extends mixins(ServerMixin) {
  @Prop({default: false}) readonly refresh!: Boolean;

  loading: boolean = true;

  headers: Object[] = [
    {
      text: 'Filename',
      align: 'start',
      sortable: true,
      value: 'filename'
    },
    {
      text: 'Tags',
      value: 'evaluationTags',
      sortable: true
    },
    {text: 'Uploaded', value: 'createdAt', sortable: true},
    {
      text: 'Actions',
      value: 'actions',
      align: 'right'
    }
  ];

  @Watch('refresh')
  onChildChanged(newRefreshValue: boolean, _oldValue: boolean) {
    if (newRefreshValue === true) {
      // Whenever refresh is set to true, call refresh on the database results
      this.get_all_results();
    }
  }

  mounted() {
    this.get_all_results();
  }

  async get_all_results(): Promise<void> {
    await EvaluationModule.getAllEvaluations().catch((err) => {
      SnackbarModule.failure(`${err}. Please reload the page and try again.`);
    }).finally(() => {
      this.loading = false;
    });
  }

  get files(){
    return EvaluationModule.allEvaluations;
  }

  load_results(evaluations: IEvaluation[]): void {
    EvaluationModule.load_results(evaluations).then((fileIds: (FileID | void)[]) => {
      this.$emit('got-files', fileIds.filter(Boolean));
    });
  }
}
</script>
