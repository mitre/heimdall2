<template>
  <span>
    <div class="d-flex flex-row-reverse">
      <v-btn icon style="cursor: pointer" @click="updateSearch">
        <v-icon
          b-tooltip.hover
          title="Request content from the server"
          color="primary"
          >mdi-refresh</v-icon
        >
      </v-btn>
      <v-btn icon style="cursor: pointer" @click="logout">
        <v-icon b-tooltip.hover title="Return to login page" color="red"
          >mdi-logout</v-icon
        >
      </v-btn>
    </div>

    <h3>Scans Options</h3>

    <v-container class="bg-surface-variant">
      <v-row no-gutters>
        <v-col cols="12" sm="8">
          <v-sheet>
            <v-radio-group v-model="scanDays" row inline>
              <v-radio
                label="Today's"
                :value="0"
                tooltip.hover
                title="Show today's scans"
                @click="updateSearch"
              />
              <v-radio
                label="30 Days"
                :value="30"
                tooltip.hover
                title="Show 30 days cumulative scans"
                @click="updateSearch"
              />
              <v-radio
                label="60 Days"
                :value="60"
                tooltip.hover
                title="Show 60 days cumulative scans"
                @click="updateSearch"
              />
              <v-radio
                label="90 Days"
                :value="90"
                tooltip.hover
                title="Show 90 days cumulative scans"
                @click="updateSearch"
              />
            </v-radio-group>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>

    <v-spacer />

    <div class="d-flex flex-column justify-content-between">
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
        <template #no-data> No data. Try relaxing the scan options. </template>
      </v-data-table>
      <v-btn block class="card-outter" @click="loadResults">
        Load Selected
        <v-icon class="pl-2"> mdi-file-download</v-icon>
      </v-btn>
    </div>
  </span>
</template>

<script lang="ts">
import {InspecIntakeModule, FileLoadOptions} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {FileMetaData} from '@mitre/hdf-converters';
import {AuthInfo, ScanResults, TenableUtil} from '@/utilities/tenable_util';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {InspecDataModule} from '@/store/data_store';

@Component({})
export default class FileList extends Vue {
  @Prop({type: Object, required: true}) readonly tenableConfig!: AuthInfo;

  executions: Omit<FileMetaData, 'profile_sha256'>[] = [];
  selectedExecutions: Omit<FileMetaData, 'profile_sha256'>[] = [];

  loading = false;

  scanDays = 0;

  /** Table info */
  headers = [
    {
      text: 'Scan ID',
      value: 'id',
      filterable: true,
      align: 'start'
    },
    {
      text: 'Name',
      value: 'name',
      align: 'start'
    },
    {
      text: 'Details',
      value: 'details',
      align: 'start'
    },
    {
      text: 'IPs',
      value: 'scannedIPs'
    },
    {
      text: 'Total Checks',
      value: 'totalChecks'
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
    }
  ];

  async updateSearch() {
    this.loading = true;

    // Get todays date
    const dateNow = new Date();

    // Convert date to epoch number value
    const endTime = Math.trunc(dateNow.getTime() / 1000);

    // Set the start time to midnight (start of the day), converting to epoch
    dateNow.setHours(0, 0, 0, 0);
    const startTime = Math.trunc(
      dateNow.setDate(dateNow.getDate() - this.scanDays) / 1000
    );

    const results = await new TenableUtil(this.tenableConfig).getScans(
      startTime,
      endTime
    );
    this.executions = [];
    results.forEach((result: ScanResults) => {
      result.totalChecks = this.formatNumberOfScans(result.totalChecks);
      result.startTime = this.epochToDate(result.startTime);
      result.finishTime = this.epochToDate(result.finishTime);
      this.executions.push(result);
    });
    this.loading = false;
    SnackbarModule.notify(
      'Successfully queried Tenable.sc for available scan results'
    );
  }

  async loadResults() {
    this.loading = true;

    const files = this.selectedExecutions.map(
      async (execution: Partial<ScanResults>) => {
        if (execution.id) {
          if (execution.status === 'Running') {
            SnackbarModule.failure(
              `Scan ${execution.id} hasn't finished, wait until completed before loading for viewing.`
            );
          } else {
            const resultData = await new TenableUtil(
              this.tenableConfig
            ).getVulnerabilities(execution.id);
            if (resultData) {
              // Check is this scan is already loaded
              let isLoaded = false;
              const loadedFiles = InspecDataModule.allEvaluationFiles;

              // We need to check if loaded zip file contained multiple scans, where they are
              // loaded as [scanId]-[ReportHost] (i.e. 9214-mitre-saf-rhel8-mitre.org)
              // if they are, just use the scanId for the Map key. If the scan contains a single
              // scan it is loaded as [scanId].nessus (i.e. 9213.nessus)
              const loadedMap = new Map(
                loadedFiles.map((obj) => [
                  obj.filename.indexOf('-') != -1
                    ? obj.filename.substring(0, obj.filename.indexOf('-'))
                    : obj.filename.substring(0, obj.filename.indexOf('.')),
                  obj.uniqueId
                ])
              );

              isLoaded = loadedMap.has(execution.id);
              if (!isLoaded) {
                try {
                  const textFile: FileLoadOptions = {
                    filename: execution.id + '.nessus',
                    data: resultData
                  };
                  // .loadFile evaluates to data if file is not provided
                  return await InspecIntakeModule.loadFile(textFile);
                } catch (err) {
                  SnackbarModule.failure(String(err));
                }
              }
            } else {
              SnackbarModule.failure(
                'Attempted to load an undefined execution'
              );
              throw new Error('Attempted to load an undefined execution');
            }
          }
        }
      }
    );
    await Promise.all(files);
    this.loading = false;
    this.$emit('got-files', files);
  }

  async mounted() {
    await this.updateSearch();
  }

  epochToDate(date: string): string {
    return Number(date) !== -1
      ? new Date(Number(date) * 1000).toLocaleString()
      : '';
  }

  formatNumberOfScans(value: string | undefined): string {
    return Number(value) !== -1
      ? Number(value).toLocaleString('en-US').toString()
      : '-';
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
