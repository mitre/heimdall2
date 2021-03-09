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
      @load-results="load_results($event)"
    />
  </v-card>
</template>

<script lang="ts">
import Component, {mixins} from 'vue-class-component';
import LoadFileList from '@/components/global/upload_tabs/LoadFileList.vue';
import {EvaluationModule} from '@/store/evaluations';
import RefreshButton from '@/components/generic/RefreshButton.vue';

import {FileID} from '@/store/report_intake';

import {IEvaluation} from '@heimdall/interfaces';
import ServerMixin from '@/mixins/ServerMixin';
import {Prop, Watch} from 'vue-property-decorator';
import {Sample} from '../../../utilities/sample_util';

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
    EvaluationModule.getAllEvaluations();
  }

  get loading() {
    return EvaluationModule.loading;
  }

  get files(){
    return EvaluationModule.allEvaluations;
  }

  joinEvaluationsByIds(evaluations: IEvaluation[] | Sample[]): string {
    let stringresult = '';
    evaluations.forEach((evaluation: IEvaluation | Sample) => {
      if(evaluation.hasOwnProperty('id')){
        stringresult += `${(evaluation as IEvaluation).id},`;
      }
    });
    return stringresult.slice(0, -1);
  }

  load_results(evaluations: IEvaluation[]): void {
    this.$router.push(`/results/${this.joinEvaluationsByIds(evaluations)}`);
  }
}
</script>
