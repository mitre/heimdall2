<template>
  <span>
    <div
      class="d-flex flex-row-reverse"
      style="cursor: pointer"
    >
      <v-btn icon @click="updateSearch" v-b-tooltip.hover title="Request content from the server">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
      <div @click="logout" v-b-tooltip.hover title="Return to login page">
        <span class="pt-2 pr-4">Sign Out</span>
        <v-icon color="red" class="pr-2" >mdi-logout</v-icon>         
      </div>
    </div>

    <div class="d-flex flex-column">
      <v-data-table
        v-model="selectedExecutions"
        :headers="headers"
        item-key="id"
        :items="executions"
        :items-per-page="5"
        :loading="loading"
        :show-sort-icons="true"
        show-select
      >
        <!-- <template #[`item.actions`]="{item}">
          <v-icon @click="load_event(item)"> mdi-plus-circle </v-icon>
        </template> -->
        <template #no-data>
          No data. Try relaxing the search conditions, or expanding the date
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
//import {SplunkReport} from '@mitre/hdf-converters/src/converters-from-hdf/splunk/splunk-report-types';
import {SplunkMapper} from '@mitre/hdf-converters/src/splunk-mapper';
import {AuthInfo, ScanResults, TenableUtil} from '@/utilities/tenable_util';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';

@Component({})
export default class FileList extends Vue {
  @Prop({type: Object, required: true}) readonly tenableConfig!: AuthInfo;

  splunkConverter?: SplunkMapper;

  executions: Omit<FileMetaData, 'profile_sha256'>[] = [];
  selectedExecutions: Omit<FileMetaData, 'profile_sha256'>[] = [];

  //search = '';
  //awaitingSearch = false;
  //initalSearchDone = false;
  loading = false;

  /** Table info */
  headers = [
    {
      text: 'Scan ID',
      value: 'id',
      filterable: true,
      align: 'center'
    },
    {
      text: 'Name',
      value: 'name',
      align: 'start'
    },
    {
      text: 'Description',
      value: 'description'
    },
    {
      text: 'Scanned IPs',
      value: 'scannedIPs'
    },    
    {
      text: 'Start Time',
      value: 'startTime'
    },
    {
      text: 'Finished Time',
      value: 'finishTime'
    },
    {
      text: 'Scan Status',
      value: 'status'
    },        
  ];

  // @Watch('search')
  // async onUpdateSearch() {
  //   console.log('async onUpdateSearch()')
  //   // On first load we update the search field which triggers this function, instead of waiting this time we can just search right away
  //   if (!this.initalSearchDone) {
  //     this.initalSearchDone = true;
  //     this.updateSearch();
  //   } else if (!this.awaitingSearch) {
  //     setTimeout(() => {
  //       this.updateSearch();
  //       this.awaitingSearch = false;
  //     }, 1000); // Wait for user input for 1 second before executing our query
  //     this.awaitingSearch = true;
  //   }
  // }

  async updateSearch() {
    this.loading = true;
    // this.splunkConverter = new SplunkMapper(this.splunkConfig, true);
    // const results = await this.splunkConverter.queryData(this.search);
    const results = await new TenableUtil(this.tenableConfig).getScans();
    this.executions = [];
    results.forEach((result: ScanResults) => {
      result.startTime = this.epochToDate(result.startTime);
      result.finishTime = this.epochToDate(result.finishTime);
      this.executions.push(result);
    });
    this.loading = false;
    SnackbarModule.notify('Successfully queried Tenable.sc for available scan results');
  }

  async mounted() {
    this.updateSearch();
  }

  async loadResults() {
    this.loading = true;
    console.log("this.selectedExecutions: ", typeof this.selectedExecutions)
    console.log("this.selectedExecutions.map: ", this.selectedExecutions[0])
    const files = this.selectedExecutions.map(
      //
      async (execution: Partial<ScanResults>) => {
        console.log("processing file: ", execution.id)
        if (execution.id) {
          const results = await new TenableUtil(this.tenableConfig).getVulnerabilities(execution.id);
        }
        
        // const hdf = await this.splunkConverter
        //   ?.toHdf(execution.guid || '')
        //   .catch((error) => {
        //     SnackbarModule.failure(error);
        //     this.loading = false;
        //     throw error;
        //   });
        // if (hdf) {
        //   return InspecIntakeModule.loadText({
        //     text: JSON.stringify(hdf),
        //     filename: _.get(hdf, 'meta.filename') as unknown as string
        //   }).catch((err) => {
        //     SnackbarModule.failure(String(err));
        //   });
        // } else {
        //   SnackbarModule.failure('Attempted to load an undefined execution');
        //   throw new Error('Attempted to load an undefined execution');
        // }
      }
    );
    await Promise.all(files);
    this.loading = false;
    this.$emit('got-files', files);
  }

  epochToDate(date: string): string {
    console.log('date is', date)
    return (Number(date) !== -1)
      ? new Date(Number(date) * 1000).toLocaleString('en-US', {timeZone: 'UTC', hour12:false})
      : '';
  }

  logout() {
    this.$emit('signOut');
  }
}
</script>
