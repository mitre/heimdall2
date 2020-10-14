<template>
  <BaseView :title="curr_title">
    <!-- Topbar config - give it a search bar -->
    <template #topbar-content>
      <template v-if="!is_mobile">
        <v-text-field
          v-model="search_term"
          flat
          hide-details
          solo
          prepend-inner-icon="mdi-magnify"
          label="Search"
          clearable
          class="mx-2"
          @click:clear="clear_search()"
        />

        <v-btn :disabled="!can_clear" @click="clear">
          <span class="d-none d-md-inline pr-2"> Clear </span>
          <v-icon>mdi-filter-remove</v-icon>
        </v-btn>
      </template>
      <template v-else
        ><v-btn @click="handle_msearch_open">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
        <div v-show="show_search_mobile">
          <v-text-field
            ref="msearch"
            v-model="search_term"
            flat
            hide-details
            solo
            prepend-inner-icon="mdi-magnify"
            label="Search"
            clearable
            class="overtake-bar mx-2"
            @blur="show_search_mobile = false"
            @click:clear="clear"
          />
        </div>
      </template>
    </template>
    <template #topbar-data>
      <div class="text-center">
        <v-menu>
          <template #activator="{on, attrs}">
            <v-btn v-bind="attrs" class="mr-2" v-on="on">
              <span class="d-none d-md-inline mr-2"> Export </span>
              <v-icon> mdi-file-export </v-icon>
            </v-btn>
          </template>
          <v-list class="py-0">
            <v-list-item class="px-0">
              <ExportCaat :filter="all_filter" />
            </v-list-item>
            <v-list-item class="px-0">
              <ExportNist :filter="all_filter" />
            </v-list-item>
            <v-list-item class="px-0">
              <ExportJson />
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </template>

    <!-- The main content: cards, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pa-2>
        <!-- Evaluation Info -->
        <v-row>
          <v-col v-if="file_filter.length > 3">
            <v-slide-group v-model="eval_info" show-arrows>
              <v-slide-item
                v-for="(file, i) in file_filter"
                :key="i"
                v-slot="{toggle}"
                class="mx-2"
              >
                <v-card :width="info_width" @click="toggle">
                  <EvaluationInfo :file_filter="file" />
                  <v-card-subtitle style="text-align: right">
                    Profile Info ↓
                  </v-card-subtitle>
                </v-card>
              </v-slide-item>
            </v-slide-group>
            <ProfData
              v-if="eval_info != null"
              class="my-4 mx-10"
              :selected_prof="
                root_profiles[prof_ids.indexOf(file_filter[eval_info])]
              "
            />
          </v-col>
          <v-col
            v-for="(file, i) in file_filter"
            v-else
            :key="i"
            :cols="12 / file_filter.length"
          >
            <v-card @click="toggle_prof(i)">
              <EvaluationInfo :file_filter="file" />
              <v-card-subtitle style="text-align: right">
                Profile Info ↓
              </v-card-subtitle>
            </v-card>
          </v-col>
          <ProfData
            v-if="eval_info != null && file_filter.length <= 3"
            class="my-4 mx-10"
            :selected_prof="
              root_profiles[prof_ids.indexOf(file_filter[eval_info])]
            "
          />
        </v-row>
        <!-- Count Cards -->
        <StatusCardRow
          :filter="all_filter"
          @show-errors="status_filter = 'Profile Error'"
        />
        <!-- Compliance Cards -->
        <v-row justify="space-around">
          <v-col xs="4">
            <v-card class="fill-height">
              <v-card-title class="justify-center">Status Counts</v-card-title>
              <v-card-actions class="justify-center">
                <StatusChart v-model="status_filter" :filter="all_filter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card class="fill-height">
              <v-card-title class="justify-center"
                >Severity Counts</v-card-title
              >
              <v-card-actions class="justify-center">
                <SeverityChart v-model="severity_filter" :filter="all_filter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card class="fill-height">
              <v-card-title class="justify-center"
                >Compliance Level</v-card-title
              >
              <v-card-actions class="justify-center">
                <ComplianceChart :filter="all_filter" />
              </v-card-actions>
              <v-card-text style="text-align: center"
                >[Passed/(Passed + Failed + Not Reviewed + Profile Error) *
                100]</v-card-text
              >
            </v-card>
          </v-col>
        </v-row>

        <!-- TreeMap and Partition Map -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <v-card-title>TreeMap</v-card-title>
              <v-card-text>
                <Treemap
                  v-model="tree_filters"
                  :filter="treemap_full_filter"
                  :selected_control.sync="control_selection"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- DataTable -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <v-card-title>Results View Data</v-card-title>
              <ControlTable :filter="all_filter" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- Everything-is-filtered snackbar -->
    <v-snackbar
      v-model="filter_snackbar"
      class="mt-11"
      style="z-index: 2"
      :timeout="-1"
      color="warning"
      top
    >
      <span v-if="file_filter.length" class="subtitle-2">
        All results are filtered out. Use the
        <v-icon>mdi-filter-remove</v-icon> button in the top right to clear
        filters and show all.
      </span>
      <span v-else-if="no_files" class="subtitle-2">
        No files are currently loaded. Press the <strong>LOAD</strong>
        <v-icon class="mx-1"> mdi-cloud-upload</v-icon> button above to load
        some.
      </span>
      <span v-else class="subtitle-2">
        No files are currently enabled for viewing. Open the
        <v-icon class="mx-1">mdi-menu</v-icon> sidebar menu, and ensure that the
        file(s) you wish to view have are
        <v-icon class="mx-1">mdi-checkbox-marked</v-icon> checked.
      </span>
    </v-snackbar>
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import BaseView from '@/views/BaseView.vue';

import StatusCardRow from '@/components/cards/StatusCardRow.vue';
import ControlTable from '@/components/cards/controltable/ControlTable.vue';
import Treemap from '@/components/cards/treemap/Treemap.vue';
import StatusChart from '@/components/cards/StatusChart.vue';
import SeverityChart from '@/components/cards/SeverityChart.vue';
import ComplianceChart from '@/components/cards/ComplianceChart.vue';

import ExportCaat from '@/components/global/ExportCaat.vue';
import ExportNist from '@/components/global/ExportNist.vue';
import ExportJson from '@/components/global/ExportJson.vue';
import EvaluationInfo from '@/components/cards/EvaluationInfo.vue';

import {FilteredDataModule, Filter, TreeMapState} from '@/store/data_filters';
import {ControlStatus, Severity} from 'inspecjs';
import {FileID, SourcedContextualizedEvaluation} from '@/store/report_intake';
import {InspecDataModule, isFromProfileFile} from '@/store/data_store';

import ProfData from '@/components/cards/ProfData.vue';
import {context} from 'inspecjs';

import {ServerModule} from '@/store/server';

// We declare the props separately
// to make props types inferrable.
const ResultsProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    BaseView,
    StatusCardRow,
    Treemap,
    ControlTable,
    StatusChart,
    SeverityChart,
    ComplianceChart,
    ExportCaat,
    ExportNist,
    ExportJson,
    EvaluationInfo,
    ProfData
  }
})
export default class Results extends ResultsProps {
  /**
   * The currently selected severity, as modeled by the severity chart
   */
  severity_filter: Severity | null = null;

  /**
   * The currently selected status, as modeled by the status chart
   */
  status_filter: ControlStatus | null = null;

  /**
   * The current state of the treemap as modeled by the treemap (duh).
   * Once can reliably expect that if a "deep" selection is not null, then its parent should also be not-null.
   */
  tree_filters: TreeMapState = [];
  control_selection: string | null = null;

  /**
   * The current search term, as modeled by the search bar
   * Never empty - should in that case be null
   */
  search_term: string = '';

  /** Model for if all-filtered snackbar should be showing */
  filter_snackbar: boolean = false;

  eval_info: number | null = null;

  /** Determines if we should make the search bar colapseable */
  is_mobile: boolean = false;
  show_search_mobile: boolean = false;
  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */

  get file_filter(): FileID[] {
    return FilteredDataModule.selected_file_ids;
  }

  // Returns true if no files are uploaded
  get no_files(): boolean {
    return InspecDataModule.allFiles.length === 0;
  }

  /**
   * Check if the screen width will break the search bar
   */
  onResize() {
    this.is_mobile = window.innerWidth < 600;
  }

  handle_msearch_open() {
    this.show_search_mobile = true;
  }

  /**
   * The filter for charts. Contains all of our filter stuff
   */
  get all_filter(): Filter {
    return {
      status: this.status_filter || undefined,
      severity: this.severity_filter || undefined,
      fromFile: this.file_filter,
      tree_filters: this.tree_filters,
      search_term: this.search_term || '',
      omit_overlayed_controls: true,
      control_id: this.control_selection || undefined
    };
  }

  /**
   * The filter for treemap. Omits its own stuff
   */
  get treemap_full_filter(): Filter {
    return {
      status: this.status_filter || undefined,
      severity: this.severity_filter || undefined,
      fromFile: this.file_filter,
      search_term: this.search_term || '',
      omit_overlayed_controls: true
    };
  }

  /**
   * Clear all filters
   */
  clear() {
    this.filter_snackbar = false;
    this.severity_filter = null;
    this.status_filter = null;
    this.control_selection = null;
    this.search_term = '';
    this.tree_filters = [];
  }

  clear_search() {
    this.search_term = '';
  }

  /**
   * Returns true if we can currently clear.
   * Essentially, just controls whether the button is available
   */
  get can_clear(): boolean {
    // Return if any params not null/empty
    let result: boolean;
    if (
      this.severity_filter ||
      this.status_filter ||
      this.search_term !== '' ||
      this.tree_filters.length
    ) {
      result = true;
    } else {
      result = false;
    }

    // Logic to check: are any files actually visible?
    if (FilteredDataModule.controls(this.all_filter).length === 0) {
      this.filter_snackbar = true;
    } else {
      this.filter_snackbar = false;
    }

    // Finally, return our result
    return result;
  }

  /**
   * The title to override with
   */
  get curr_title(): string | undefined {
    if (this.file_filter.length == 1) {
      let file = InspecDataModule.allFiles.find(
        (f) => f.unique_id === this.file_filter[0]
      );
      if (file) {
        return file.filename;
      }
    }
    if (this.file_filter.length > 1) {
      return this.file_filter.length + ' files selected';
    } else {
      return 'No files selected';
    }
  }

  //changes width of eval info if it is in server mode and needs more room for tags
  get info_width(): number {
    if (ServerModule.serverMode) {
      return 500;
    }
    return 300;
  }

  /** Flat representation of all profiles that ought to be visible  */
  get visible_profiles(): Readonly<context.ContextualizedProfile[]> {
    return FilteredDataModule.profiles(this.all_filter.fromFile);
  }

  get root_profiles(): context.ContextualizedProfile[] {
    // Strip to roots
    let profiles = this.visible_profiles.filter(
      (p) => p.extended_by.length === 0
    );
    return profiles;
  }

  //gets profile ids for the profData component to display corresponding info
  get prof_ids(): FileID[] {
    let ids = [];
    for (let prof of this.root_profiles) {
      if (!isFromProfileFile(prof)) {
        ids.push(
          (prof.sourced_from as SourcedContextualizedEvaluation).from_file
            .unique_id
        );
      } else {
        ids.push(prof.from_file.unique_id);
      }
    }
    return ids;
  }

  //basically a v-model for the eval info cards when there is no slide group
  toggle_prof(index: number) {
    if (index == this.eval_info) {
      this.eval_info = null;
    } else {
      this.eval_info = index;
    }
  }
  // Listening for window resize
  created() {
    this.onResize();

    window.addEventListener('resize', this.onResize, {passive: true});
  }

  beforeDestroy() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('resize', this.onResize);
  }
}
</script>

<style scoped>
.glow {
  box-shadow: 0px 0px 8px 6px #5a5;
}
.overtake-bar {
  width: 96%;
  position: absolute;
  left: 0px;
  top: 4px;
  z-index: 5;
}
</style>
