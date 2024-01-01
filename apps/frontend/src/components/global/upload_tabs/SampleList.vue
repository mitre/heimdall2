<template>
  <v-card class="elevation-0">
    <v-row class="pt-5" justify="space-between">
      <v-card-subtitle>
        Samples to show the power of the Heimdall application and supported OHDF
        formats.
      </v-card-subtitle>
      <v-btn class="mr-8 ml-2 mt-2" icon small @click="isActiveDialog = true">
        <v-icon b-tooltip.hover title="Filter Instructions" color="primary">
          mdi-information-outline
        </v-icon>
      </v-btn>
      <v-dialog v-model="isActiveDialog" width="500">
        <v-card>
          <v-card-title>Filter Instructions</v-card-title>
          <v-card-text class="text-h7">
            Sample entries can be filtered by entering the value into the search
            input text field. The result of the filtering process will include
            entries not currently visible (on another page).
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="isActiveDialog = false">Close Dialog</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
    <v-container class="mx-0 px-0">
      <div>
        <div class="ma-0 pa-0">
          <v-text-field
            v-model="search"
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
              fixed-header
              mobile-breakpoint="0"
              :headers="headers"
              :items="samples"
              :search="search"
              :sort-by.sync="sortBy"
              :sort-desc="sortDesc"
              :loading="loading"
              :item-key="fileKey"
              :height="tableHight"
              :header-props="headerprops"
              :footer-props="{
                showFirstLastPage: true,
                firstIcon: 'mdi-page-first',
                lastIcon: 'mdi-page-last',
                prevIcon: 'mdi-chevron-left-circle-outline',
                nextIcon: 'mdi-chevron-right-circle-outline',
                itemsPerPageText: 'Rows per page:'
              }"
            >
              <!-- Customize the sort icon-->
              <template #[`header.filename`]="{header}">
                {{ header.text.toUpperCase() }}
                <v-icon
                  v-if="header.sortable"
                  class="v-data-table-header__icon page-of-pages-div"
                  medium
                >
                  mdi-sort
                </v-icon>
              </template>

              <!-- Customize pagination -->
              <template #footer="{props}">
                <div class="pr-10 text-right page-of-pages-div">
                  <b>
                    Page {{ props.pagination.page }} of
                    {{ props.pagination.pageCount }}
                  </b>
                </div>
              </template>

              <!-- Customize the display text -->
              <template #[`item.filename`]="{item}">
                <span class="cursor-pointer" @click="load_samples([item])">
                  {{ item.filename }}
                </span>
              </template>
            </v-data-table>

            <!-- Load selected scan -->
            <v-tooltip top>
              <template #activator="{on, attrs}">
                <v-btn
                  v-bind="attrs"
                  block
                  class="card-outter"
                  :disabled="loading"
                  v-on="on"
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
import {SnackbarModule} from '@/store/snackbar';
import {FileID, InspecIntakeModule} from '@/store/report_intake';
import {Sample, samples, fetchSample} from '@/utilities/sample_util';
import Vue from 'vue';
import Component from 'vue-class-component';

// Needed to render the show-select
@Component({
  components: {}
})
export default class SampleList extends Vue {
  samples: Sample[] = samples; // Get the samples from utilities
  selectedFiles: Sample[] = [];

  isActiveDialog = false;

  headers: Object[] = [
    {
      text: 'Filename',
      align: 'left',
      class: 'sticky-header',
      sortable: true,
      value: 'filename'
    }
  ];

  isActive = false;

  sortBy = 'filename';
  fileKey = 'filename';
  sortDesc = false;
  loading = false;
  tableHight = '400px';
  search = '';
  searchItem = '';

  headerprops = {
    'sort-icon': 'mdi-dot', // Hack to hide the default sort icon
    'sort-by-text': 'filename' // used when rendering the mobile view
  };

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
      SnackbarModule.notify(
        'Please select a sample for viewing in the visualization panel'
      );
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

.page-of-pages-div {
  color: deepskyblue !important;
}
.table >>> th {
  font-size: 0.95rem !important;
}
.table >>> .v-data-footer__select,
.table >>> .v-select__selection,
.table >>> .v-data-footer__pagination {
  font-size: 0.96rem;
}
</style>
