<template>
  <span>
    <div
      class="d-flex flex-row-reverse"
      style="cursor: pointer"
      @click="logout"
    >
      <span>Sign Out</span>
      <v-icon color="red" class="pr-2">mdi-logout</v-icon>
    </div>
    <div class="d-flex flex-column">
      <v-text-field
        v-model="search"
        class="px-3"
        append-icon="mdi-magnify"
        label="Search"
        hide-details
      />
      <v-data-table
        v-model="selectedExecutions"
        :headers="headers"
        item-key="guid"
        :items="executions"
        :loading="loading"
        show-select
      >
        <template #[`item.actions`]="{item}">
          <v-icon @click="load_event(item)"> mdi-plus-circle </v-icon>
        </template>
        <template #no-data>
          No data. Try relaxing your search conditions, or expanding the date
          range.
        </template>
      </v-data-table>
      <v-btn block class="card-outter" @click="loadResults">
        Load Selected
        <v-icon class="pl-2"> mdi-file-download</v-icon>
      </v-btn>
    </div>
  </span>
</template>

<script lang="ts">
import {InspecIntakeModule} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {
  FileMetaData,
  getAllExecutions,
  getExecution,
  SplunkClient
} from '@/utilities/splunk_util';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
@Component({})
export default class FileList extends Vue {
  @Prop({type: Object, required: true}) readonly splunkClient!: SplunkClient;

  search = 'index="*" "meta.subtype"=header';
  loading = false;
  executions: FileMetaData[] = [];
  selectedExecutions: FileMetaData[] = [];

  /** Table info */
  headers = [
    {
      text: 'Filename',
      value: 'filename',
      filterable: true,
      align: 'start'
    },
    {
      text: 'Time',
      value: 'start_time'
    },
    {
      text: 'Action',
      value: 'action',
      sortable: false
    }
  ];

  @Watch('search')
  async onUpdateSearch() {
    this.loading = true;
    this.executions = await getAllExecutions(this.splunkClient, this.search).then((executions) => {
      this.loading = false;
      return executions
    })
  }

  async mounted() {
    this.loading = true;
    this.executions = await getAllExecutions(this.splunkClient, this.search).then((executions) => {
      this.loading = false;
      return executions
    })
  }

  async loadResults() {
    this.loading = true;
    const files = this.selectedExecutions.map(async (execution) => {
      return getExecution(this.splunkClient, execution.guid).then(async (result) => {
        return InspecIntakeModule.loadText({
          text: JSON.stringify(result),
          filename: _.get(result, 'meta.filename')
        }).catch((err) => {
          SnackbarModule.failure(String(err));
        });
      });
    });
    this.$emit('got-files', files);
  }

  logout() {
    this.$emit('signOut');
  }
}
</script>
