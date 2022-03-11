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
import {LocalStorageVal} from '@/utilities/helper_util';
import {FileMetaData, SplunkConfig} from '@mitre/hdf-converters';
import {SplunkReport} from '@mitre/hdf-converters/src/converters-from-hdf/splunk/splunk-report-types';
import {SplunkMapper} from '@mitre/hdf-converters/src/splunk-mapper';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';

const localSplunkQuery = new LocalStorageVal<string>('splunk_query');

@Component({})
export default class FileList extends Vue {
  @Prop({type: Object, required: true}) readonly splunkConfig!: SplunkConfig;

  splunkConverter?: SplunkMapper;

  executions: Omit<FileMetaData, 'profile_sha256'>[] = [];
  selectedExecutions: Omit<FileMetaData, 'profile_sha256'>[] = [];

  search = 'search index="*" "meta.subtype"=header';
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
    this.updateSearch();
  }

  async updateSearch() {
    this.loading = true;
    this.splunkConverter = new SplunkMapper(this.splunkConfig);
    const results = await this.splunkConverter.queryData(this.search);
    localSplunkQuery.set(this.search);
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
    this.search = localSplunkQuery.get_default(
      'search index="*" "meta.subtype"=header'
    );
  }

  async loadResults() {
    this.loading = true;
    const files = this.selectedExecutions.map(
      async (execution: Partial<FileMetaData>) => {
        const hdf = await this.splunkConverter?.toHdf(execution.guid || '');
        if (hdf) {
          return InspecIntakeModule.loadText({
            text: JSON.stringify(hdf),
            filename: _.get(hdf, 'meta.filename')
          }).catch((err) => {
            SnackbarModule.failure(String(err));
          });
        }
      }
    );
    this.loading = false;
    this.$emit('got-files', files);
  }

  logout() {
    this.$emit('signOut');
  }
}
</script>
