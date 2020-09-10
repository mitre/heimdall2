<template>
  <BaseView :title="curr_title">
    <!-- Topbar config - give it a search bar -->
    <template #topbar-content>
      <v-text-field
        flat
        solo
        solo-inverted
        hide-details
        prepend-inner-icon="mdi-magnify"
        label="Search"
        v-model="search_term"
        clearable
        @click:clear="clear_search()"
        class="mx-2"
      />

      <v-btn @click="clear" :disabled="!can_clear">
        <span class="d-none d-md-inline pr-2">
          Clear
        </span>
        <v-icon>mdi-filter-remove</v-icon>
      </v-btn>
    </template>

    <!-- Custom sidebar content -->
    <template #sidebar-content-tools>
      <ExportCaat :filter="all_filter"></ExportCaat>
      <ExportNist :filter="all_filter"></ExportNist>
      <ExportJson></ExportJson>
    </template>

    <!-- The main content: cards, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pa-2>
        <!-- Evaluation Info -->
        <v-row>
          <v-col v-if="file_filter.length > 3">
            <v-slide-group show-arrows v-model="eval_info">
              <v-slide-item
                v-for="(file, i) in file_filter"
                :key="i"
                class="mx-2"
                v-slot:default="{active, toggle}"
              >
                <v-card :width="info_width" @click="toggle">
                  <EvaluationInfo :file_filter="file" />
                  <v-card-subtitle style="text-align: right;">
                    Profile Info ↓
                  </v-card-subtitle>
                </v-card>
              </v-slide-item>
            </v-slide-group>
            <ProfData
              class="my-4 mx-10"
              v-if="eval_info != null"
              :selected_prof="
                root_profiles[prof_ids.indexOf(file_filter[eval_info])]
              "
            ></ProfData>
          </v-col>
          <v-col
            v-else
            v-for="(file, i) in file_filter"
            :key="i"
            :cols="12 / file_filter.length"
          >
            <v-card @click="toggle_prof(i)">
              <EvaluationInfo :file_filter="file" />
              <v-card-subtitle style="text-align: right;">
                Profile Info ↓
              </v-card-subtitle>
            </v-card>
          </v-col>
          <ProfData
            class="my-4 mx-10"
            v-if="eval_info != null && file_filter.length <= 3"
            :selected_prof="
              root_profiles[prof_ids.indexOf(file_filter[eval_info])]
            "
          ></ProfData>
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
                <StatusChart :filter="all_filter" v-model="status_filter" />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col xs="4">
            <v-card class="fill-height">
              <v-card-title class="justify-center"
                >Severity Counts</v-card-title
              >
              <v-card-actions class="justify-center">
                <SeverityChart :filter="all_filter" v-model="severity_filter" />
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
                  :filter="treemap_full_filter"
                  v-model="tree_filters"
                  v-bind:selected_control.sync="control_selection"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- DataTable -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <v-card-title>Profiles View Data</v-card-title>
              <ControlTable :filter="all_filter" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- Everything-is-filtered snackbar -->
    <v-snackbar
      style="margin-top: 44px;"
      v-model="filter_snackbar"
      :timeout="0"
      color="warning"
      top
    >
      <span class="subtitle-2" v-if="file_filter.length">
        All profiles are filtered out. Use the
        <v-icon>mdi-filter-remove</v-icon> button in the top right to clear
        filters and show all.
      </span>
      <span class="subtitle-2" v-else-if="no_files">
        No files are currently loaded. Press the <strong>LOAD</strong>
        <v-icon class="mx-1"> mdi-cloud-upload</v-icon> button above to load
        some.
      </span>
      <span class="subtitle-2" v-else>
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
import {
  FileID,
  SourcedContextualizedEvaluation
} from '@/store/report_intake';
import {InspecDataModule, isFromProfileFile} from '@/store/data_store';
import {need_redirect_file} from '@/utilities/helper_util';
import ProfData from '@/components/cards/ProfData.vue';
import {context} from 'inspecjs';
import {profile_unique_key} from '../utilities/format_util';
import UserMenu from '@/components/global/UserMenu.vue';
import {BackendModule} from '@/store/backend';

// We declare the props separately
// to make props types inferrable.
const ProfilesProps = Vue.extend({
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
    ProfData,
    UserMenu
  }
})
export default class Profiles extends ProfilesProps {
  /** Whether or not the model is showing */
  dialog: boolean = false;

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

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID[] {
    var file_ids = [...FilteredDataModule.selected_file_ids];

    var files = InspecDataModule.allEvaluationFiles;

    // do better!
    for (var x = 0; x < files.length; x++)
      for (var y = 0; y < file_ids.length; y++)
        if (files[x].unique_id === file_ids[y]) {
          // remove evaluation file
          file_ids.splice(y, 1);
          y--;
        }
    return file_ids;
  }

  // Returns true if no files are uploaded
  get no_files(): boolean {
    return InspecDataModule.allFiles.length === 0;
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
      search_term: this.search_term,
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
      search_term: this.search_term,
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
  get curr_title(): string {
    let returnText = 'Profiles View';
    if (this.file_filter.length == 1) {
      let file = InspecDataModule.allProfileFiles.find(
        f => f.unique_id === this.file_filter[0]
      );
      if (file) {
        returnText += ` (${file.filename} selected)`;
      }
    } else {
      returnText += ` (${this.file_filter.length} results selected)`;
    }
    return returnText;
  }

  //changes width of eval info if it is in server mode and needs more room for tags
  get info_width(): number {
    if (BackendModule.serverMode) {
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
      p => p.extended_by.length === 0
    );
    return profiles;
  }

  //gets profile ids for the profData component to display corresponding info
  get prof_ids(): number[] {
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
}
</script>

<style scoped>
.glow {
  box-shadow: 0px 0px 8px 6px #5a5;
}
</style>
