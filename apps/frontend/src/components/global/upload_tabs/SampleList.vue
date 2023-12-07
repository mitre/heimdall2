<template>
  <v-card class="elevation-0">
    <v-card-subtitle>
      Samples to show the power of the Heimdall application and supported HDF
      formats
    </v-card-subtitle>
    <v-container class="mx-0 px-0">
      <div>
        <div class="ma-0 pa-0">
          <v-text-field
            v-model="searchItems"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on file name"
            placeholder="file name"
            clearable
            hide-details="auto"
          />
          <div class="d-flex flex-column">
            <v-data-table 
              v-model="selectedFiles"
              data-cy="loadFileList"
              class="pb-8 table"
              dense
              show-select
              mobile-breakpoint="0"              
              :headers="headers"
              :items="samples"
              :search="search" 
              :loading="loading"
              :sort-by.sync="sortBy"
              :sort-desc="sortDesc"
              :item-key="fileKey"
              :items-per-page="itemsPerPage"
              :height="tableHight"
              :footer-props="{
                showCurrentPage: true,
                showFirstLastPage: true,
                firstIcon: 'mdi-page-first',
                lastIcon: 'mdi-page-last',
                prevIcon: 'mdi-chevron-left-circle-outline',
                nextIcon: 'mdi-chevron-right-circle-outline',
                itemsPerPageText: 'Rows per page:',
              }"
            >
              <template #[`item.filename`]="{item}">
                <span class="cursor-pointer" @click="load_samples([item])">{{
                  item.filename
                }}</span>
              </template>
            </v-data-table>

            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  block
                  class="card-outter"
                  :disabled="loading"
                  @click="load_samples(selectedFiles)"
                >
                  Load Selected
                  <v-icon class="pl-2">mdi-file-download</v-icon>
                </v-btn>              
              </template>
              <span>Load selected sample evaluation(s)</span>
            </v-tooltip>
          </div>
        </div>
      </div>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import {FileID, InspecIntakeModule} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {Sample, samples, fetchSample} from '@/utilities/sample_util';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Watch} from 'vue-property-decorator';

@Component({
  components: {}
})
export default class SampleList extends Vue {
  samples: Sample[] = samples; // Get the samples from utilities
  selectedFiles: Sample[] = [];

  headers: Object[] = [
    {
      text: 'Filename',
      align: 'start',
      sortable: true,
      value: 'filename'
    }
  ];
  sortBy = "filename";
  fileKey = 'filename';
  sortDesc = false;
  loading = false;
  tableHight = '400px';
  itemsPerPage = 5;
  search = '';
  searchItems = '';

  @Watch('searchItems')
  onChildChanged() {
    this.search = this.searchItems;
  }

  // Fires when user selects entries and loads them into the visualization panel
  load_samples(selectedSamples: Sample[]) {
    if (selectedSamples.length != 0) {
      const promises: Promise<FileID | FileID[]>[] = [];
      this.loading = true;
      for (const sample of selectedSamples) {
        const requestFile = fetchSample(sample).then((data: File) => {
          return InspecIntakeModule.loadFile({
            file: data,
            filename: sample.filename
          });
        });
        promises.push(requestFile);
      }

      Promise.all(promises)
        .then((fileIds: (FileID | FileID[])[]) => {
          this.$emit('got-files', fileIds.flat(2));
        })
        .catch((error) => {
          SnackbarModule.failure(String(error));
        })
        .finally(() => {
          this.loading = false;
          this.selectedFiles = [];
        });
    } else {
      SnackbarModule.notify("Please select a sample file to load into the visualization panel!")
    }
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.card-outter {
  position: absolute;
  bottom: 0;
}

.table >>> th {
  font-size:0.95rem !important;
}
.table >>> .v-data-footer__select,
.table >>> .v-select__selection,
.table >>> .v-data-footer__pagination {
  font-size:0.90rem
}
</style>