<template>
  <span>
    <div class="d-flex justify-space-between">
      <v-form>
        <v-text-field
          v-model="index"
          label="Index"
          for="index_field"
          :rules="[reqRule]"
          data-cy="splunkindex"
        />
      </v-form>
      <div class="d-flex">
        <v-btn class="ml-5" icon style="cursor: pointer" @click="logout">
          <v-icon b-tooltip.hover title="Return to login page" color="red"
            >mdi-logout</v-icon
          >
        </v-btn>
        <v-btn icon style="cursor: pointer" @click="updateSearch">
          <v-icon
            b-tooltip.hover
            title="Request content from the server"
            color="blue"
            >mdi-refresh</v-icon
          >
        </v-btn>
      </div>
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
          <v-icon @click="loadEvent(item)"> mdi-plus-circle </v-icon>
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
import {FileMetaData} from '@mitre/hdf-converters';
import {SplunkMapper} from '@mitre/hdf-converters/src/splunk-mapper';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import {SplunkConfig} from '@mitre/hdf-converters/types/splunk-config-types';
import {requireFieldRule} from '@/utilities/upload_util';

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

  index = '';

  // Form required field rules
  reqRule = requireFieldRule;

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
    // Check if user has inputted an index
    if (this.index === '') {
      this.loading = false;
      SnackbarModule.failure('Failed to login - A valid index is required');
      return;
    }
    // Update index for search job if user changes targeted index; otherwise retains existing index
    this.splunkConfig.index = this.index;
    this.search = `search index="${this.index}" meta.subtype="header"`;
    this.splunkConverter = new SplunkMapper(this.splunkConfig);
    const results = await this.splunkConverter.queryData(this.search);
    this.executions = [];
    for (const result of results) {
      // Only get header objects
      if (_.get(result, 'meta.subtype').toLowerCase() === 'header') {
        this.executions.push(result.meta);
      }
    }
    this.loading = false;
  }

  async mounted() {
    this.search = `search index="${this.splunkConfig.index}" meta.subtype="header"`;
    this.index = this.splunkConfig.index;
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
            filename: _.get(hdf, 'meta.filename') as unknown as string
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

<style scoped>
.card-outter {
  position: absolute;
  bottom: 0;
}
</style>