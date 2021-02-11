<template>
  <v-card class="elevation-0">
    <v-container class="ma-0 pa-0">
      <v-row>
        <v-col cols="9">
          <v-card-subtitle>
            View files loaded into your organizations Heimdall Server instance.
          </v-card-subtitle>
        </v-col>
        <v-col cols="3" class="text-right">
          <LogoutButton />
        </v-col>
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
import LogoutButton from '@/components/generic/LogoutButton.vue';
import {SnackbarModule} from '@/store/snackbar';
import {EvaluationModule} from '@/store/evaluations'

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
    LogoutButton
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
      EvaluationModule.getAllEvaluations();
    }
  }

  mounted() {
    EvaluationModule.getAllEvaluations();
  }

  get loading() {
    return EvaluationModule.loading;
  }

  get files(){
    return EvaluationModule.allEvaluations;
  }

  load_results(evaluations: IEvaluation[]): void {
    Promise.all(
      evaluations.map(async (evaluation) => {
        return axios
          .get<IEvaluation>(`/evaluations/${evaluation.id}`)
          .then(({data}) => {
            return InspecIntakeModule.loadText({
              text: JSON.stringify(data.data),
              filename: evaluation.filename,
              database_id: evaluation.id,
              createdAt: evaluation.createdAt,
              updatedAt: evaluation.updatedAt,
              tags: [] // Tags are not yet implemented, so for now the value is passed in empty
            }).catch((err) => {
              SnackbarModule.failure(err);
            });
          })
          .catch((err) => {
            SnackbarModule.failure(err);
          });
      })
    ).then((fileIds: (FileID | void)[]) => {
      this.$emit('got-files', fileIds.filter(Boolean));
    });
  }
}
</script>
