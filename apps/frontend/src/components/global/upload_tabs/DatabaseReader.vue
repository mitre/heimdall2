<template>
  <v-container class="mx-0 px-0" fluid>
    <v-card-subtitle>
      View files maintained (stored) in the Heimdall Server backend database.
    </v-card-subtitle>
    <LoadFileList
      :headers="headers"
      :evaluations-loaded="allEvaluations"
      :loading="queryingRecords"
      :total-items-per-page="itemsPerPage"
      :evaluations-count="evaluationsCount"
      @load-selected="load_results($event)"
    />
  </v-container>
</template>

<script lang="ts">
import RefreshButton from '@/components/generic/RefreshButton.vue';
import LoadFileList from '@/components/global/upload_tabs/LoadFileList.vue';
import {FileID} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {EvaluationModule} from '@/store/evaluations';
import {IEvalPaginationParams, IEvaluation} from '@heimdall/interfaces';
import {Prop, Watch} from 'vue-property-decorator';
import Component from 'vue-class-component';
import Vue from 'vue';

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
export default class DatabaseReader extends Vue {
  @Prop({default: false}) readonly refresh!: boolean;

  headers: Object[] = [
    {
      text: 'Filename',
      value: 'filename',
      align: 'left',
      sortable: true
    },
    {
      text: 'Groups',
      value: 'groups',
      sortable: true
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
      align: 'end',
      sortable: false
    }
  ];

  itemsPerPage = 10;

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
    // Stores results in the Evaluation class field allEvaluations
    const params: IEvalPaginationParams = {
      offset: 0,
      limit: this.itemsPerPage,
      order: ['createdAt', 'DESC']
    };
    EvaluationModule.getAllEvaluations(params);
  }

  // Loading is initially set to true in Evaluation class.
  // When getAllEvaluations(params) finishes it sets it to false.
  get queryingRecords() {
    return EvaluationModule.loading;
  }

  get allEvaluations() {
    return EvaluationModule.allEvaluations;
  }

  get evaluationsCount() {
    return EvaluationModule.evaluationsCount;
  }

  // Fires when user selects entries and loads them into the visualization panel
  load_results(evaluations: IEvaluation[]): void {
    if (evaluations.length != 0) {
      EvaluationModule.load_results(
        evaluations.map((evaluation) => evaluation.id)
      ).then((fileIds: (FileID | void)[]) => {
        this.$emit('got-files', fileIds.filter(Boolean));
      });
    } else {
      SnackbarModule.notify(
        'Please select an evaluation for viewing in the visualization panel'
      );
    }
  }
}
</script>
