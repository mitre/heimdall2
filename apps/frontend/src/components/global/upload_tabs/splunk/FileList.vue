<template>
  <span>
    <div
      class="d-flex flex-row-reverse"
      style="cursor: pointer"
      @click="logout"
    >
      <v-btn icon @click="updateSearch">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
      <span class="pt-2 pr-4">Sign Out</span>
      <v-icon color="red" class="pr-2">mdi-logout</v-icon>
    </div>

    <div class="d-flex flex-column">
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
import {FileMetaData, SplunkConfig} from '@mitre/hdf-converters';
import {SplunkReport} from '@mitre/hdf-converters/src/converters-from-hdf/splunk/splunk-report-types';
import {SplunkMapper} from '@mitre/hdf-converters/src/splunk-mapper';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';

@Component({})
export default class FileList extends Vue {
  @Prop({type: Object, required: true}) readonly splunkConfig!: SplunkConfig;

  splunkConverter?: SplunkMapper;

  executions: Omit<FileMetaData, 'profile_sha256'>[] = [];
  selectedExecutions: Omit<FileMetaData, 'profile_sha256'>[] = [];

  search = '';
  awaitingSearch = false;
  initalSearchDone = false;
  loading = false;

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
      value: 'parse_time'
    }
  ];

  @Watch('search')
  async onUpdateSearch() {
    // On first load we update the search field which triggers this function, instead of waiting this time we can just search right away
    if (!this.initalSearchDone) {
      this.initalSearchDone = true;
      this.updateSearch();
    } else if (!this.awaitingSearch) {
      setTimeout(() => {
        this.updateSearch();
        this.awaitingSearch = false;
      }, 1000); // Wait for user input for 1 second before executing our query
      this.awaitingSearch = true;
    }
  }

  async updateSearch() {
    this.loading = true;
    this.splunkConverter = new SplunkMapper(this.splunkConfig, true);
    const results = await this.splunkConverter.queryData(this.search);
    this.executions = [];
    results.forEach((result: SplunkReport) => {
      // Only get header objects
      if (_.get(result, 'meta.subtype').toLowerCase() === 'header') {
        this.executions.push(result.meta);
      }
    });
    this.loading = false;
  }

  async mounted() {
    this.search = `search index="${this.splunkConfig.index}" meta.subtype="header"`;
  }

  async loadResults() {
    this.loading = true;
    const files = this.selectedExecutions.map(
      async (execution: Partial<FileMetaData>) => {
        const hdf = await this.splunkConverter
          ?.toHdf(execution.guid || '')
          .catch((error) => {
            SnackbarModule.failure(error);
            this.loading = false;
            throw error;
          });
        if (hdf) {
          return InspecIntakeModule.loadText({
            text: JSON.stringify(hdf),
            filename: _.get(hdf, 'meta.filename')
          }).catch((err) => {
            SnackbarModule.failure(String(err));
          });
        } else {
          SnackbarModule.failure('Attempted to load an undefined execution');
          throw new Error('Attempted to load an undefined execution');
        }
      }
    );
    await Promise.all(files);
    this.loading = false;
    this.$emit('got-files', files);
  }

  logout() {
    this.$emit('signOut');
  }
}
</script>
