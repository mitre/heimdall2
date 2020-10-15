<template>
  <v-card class="elevation-0">
    <v-container class="py-0 pl-0">
      <v-row>
        <v-col cols="9">
          <v-card-subtitle class="py-0">
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

  get_all_results(): void {
    axios
      .get<IEvaluation[]>('/evaluations')
      .then((response) => {
        this.files = response.data;
      })
      .catch((err) => {
        SnackbarModule.failure(`${err}. Please reload the page and try again.`);
      })
      .finally(() => {
        this.loading = false;
      });
  }

  load_results(evaluations: IEvaluation[]): void {
    Promise.all(
      evaluations.map((evaluation) => {
        return InspecIntakeModule.loadText({
          text: JSON.stringify(evaluation.data),
          filename: evaluation.filename,
          database_id: evaluation.id,
          createdAt: evaluation.createdAt,
          updatedAt: evaluation.updatedAt,
          tags: [] // Tags are not yet implemented, so for now the value is passed in empty
        }).catch((err) => {
          SnackbarModule.failure(err);
        });
      })
    ).then((fileIds: (FileID | void)[]) => {
      this.$emit('got-files', fileIds.filter(Boolean));
    });
  }
}
</script>
