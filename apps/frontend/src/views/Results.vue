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
      ></v-text-field>
      <v-spacer />
      <v-btn @click="dialog = true" :disabled="dialog" class="mx-2">
        Upload
        <v-icon class="pl-2">
          cloud_upload
        </v-icon>
      </v-btn>
      <v-btn
        class="mx-2"
        @click="clear"
        title="Clear all set filters"
        :disabled="!can_clear"
      >
        Clear
      </v-btn>
    </template>

    <!-- The main content: cards, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pa-2>
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

        <!-- Profile information -->
        <v-row>
          <v-col xs-12>
            <ProfileData :filter="all_filter" />
          </v-col>
        </v-row>

        <!-- TreeMap and Partition Map -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <v-card-title>TreeMap</v-card-title>
              <v-card-text>
                <Treemap
                  :filter="treemap_filter"
                  v-model="nist_filters"
                  @clear="clear"
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

    <!-- File select modal -->
    <UploadNexus v-model="dialog" @got-files="on_got_files" />
  </BaseView>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import BaseView from "@/views/BaseView.vue";
import UploadNexus from "@/components/global/UploadNexus.vue";

import StatusCardRow from "@/components/cards/StatusCardRow.vue";
import ControlTable from "@/components/cards/controltable/ControlTable.vue";
import Treemap from "@/components/cards/treemap/Treemap.vue";
import StatusChart from "@/components/cards/StatusChart.vue";
import SeverityChart from "@/components/cards/SeverityChart.vue";
import ComplianceChart from "@/components/cards/ComplianceChart.vue";
import ProfileData from "@/components/cards/ProfileData.vue";

import { Filter, NistMapState } from "@/store/data_filters";
import { ControlStatus, Severity } from "inspecjs";
import { FileID } from "@/store/report_intake";
import { getModule } from "vuex-module-decorators";
import InspecDataModule from "../store/data_store";

// We declare the props separately
// to make props types inferrable.
const ResultsProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    BaseView,
    UploadNexus,
    StatusCardRow,
    Treemap,
    ControlTable,
    StatusChart,
    SeverityChart,
    ComplianceChart,
    ProfileData
  }
})
export default class Results extends ResultsProps {
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
  nist_filters: NistMapState = {
    selectedFamily: null,
    selectedCategory: null,
    selectedControlID: null
  };

  /**
   * The current search term, as modeled by the search bar
   * Never empty - should in that case be null
   */
  search_term: string = "";

  /* This is supposed to cause the dialog to automatically appear if there is
   * no file uploaded
   */
  mounted() {
    if (this.file_filter) this.dialog = false;
  }

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID | null {
    let id_string: string = this.$route.params.id;
    let as_int = parseInt(id_string);
    if (isNaN(as_int)) {
      return null;
    } else {
      return as_int as FileID;
    }
  }

  /**
   * The filter for charts. Contains all of our filter stuff
   */
  get all_filter(): Filter {
    return {
      status: this.status_filter || undefined,
      severity: this.severity_filter || undefined,
      fromFile: this.file_filter || undefined,
      nist_filters: this.nist_filters,
      search_term: this.search_term,
      omit_overlayed_controls: true
    };
  }

  /**
   * The filter for treemap. Omits its own stuff
   */
  get treemap_filter(): Filter {
    return {
      status: this.status_filter || undefined,
      severity: this.severity_filter || undefined,
      fromFile: this.file_filter || undefined,
      search_term: this.search_term,
      omit_overlayed_controls: true
    };
  }

  /**
   * Clear all filters
   */
  clear() {
    this.severity_filter = null;
    this.status_filter = null;
    this.search_term = "";
    this.nist_filters = {
      selectedFamily: null,
      selectedCategory: null,
      selectedControlID: null
    };
  }

  /**
   * Returns true if we can currently clear.
   * Essentially, just controls whether the button is available
   */
  get can_clear(): boolean {
    // Return if any params not null/empty
    if (
      this.severity_filter ||
      this.status_filter ||
      this.search_term !== "" ||
      this.nist_filters.selectedFamily
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * The title to override with
   */
  get curr_title(): String | undefined {
    if (this.file_filter !== null) {
      let store = getModule(InspecDataModule, this.$store);
      let file = store.allFiles.find(f => f.unique_id === this.file_filter);
      if (file) {
        return file.filename;
      }
    }
    return undefined;
  }

  /**
   * Invoked when file(s) are loaded.
   */
  on_got_files(ids: FileID[]) {
    // Close the dialog
    this.dialog = false;

    // If just one file, focus it
    if (ids.length === 1) {
      this.$router.push(`/results/${ids[0]}`);
    }

    // If more than one, focus all.
    // TODO: Provide support for focusing a subset of files
    else if (ids.length > 1) {
      this.$router.push(`/results/all`);
    }
  }
}
</script>
