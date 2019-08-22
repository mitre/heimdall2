<template>
  <v-container fluid grid-list-md pa-2>
    <!-- Count Cards -->
    <StatusCardRow />

    <!-- Compliance Cards -->
    <v-row justify="space-around">
      <v-col xs-4>
        <v-card class="fill-height">
          <v-card-title class="justify-center">Status Counts</v-card-title>
          <v-card-actions class="justify-center">
            <StatusChart :filter="all_filter" v-model="statusFilter" />
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col xs-4>
        <v-card class="fill-height">
          <v-card-title class="justify-center">Severity Counts</v-card-title>
          <v-card-actions class="justify-center">
            <SeverityChart :filter="all_filter" v-model="severityFilter" />
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col xs-4>
        <v-card class="fill-height">
          <v-card-title class="justify-center">Compliance Level</v-card-title>
          <v-card-actions class="justify-center">
            <ComplianceChart :filter="all_filter" />
          </v-card-actions>
          <v-card-text style="text-align: center">
            [Passed/(Passed + Failed + Not Reviewed + Profile Error) * 100]
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- TreeMap and Partition Map -->
    <v-row>
      <v-col xs-12>
        <v-card elevation="2" title="test">
          <v-card-title>TreeMap</v-card-title>
          <v-card-text>
            <Treemap
              :filter="treemap_filter"
              v-model="nistFilters"
              @clear="clear"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- DataTable -->
    <v-row>
      <v-col xs-12>
        <v-sheet class="my-4 px-4" elevation="2">
          <h2>Results View Data</h2>
          <ControlTable />
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import StatusCardRow from "@/components/cards/StatusCardRow.vue";
import Treemap from "@/components/cards/treemap/Treemap.vue";
import ControlTable from "@/components/ControlTable.vue";
import StatusChart from "@/components/cards/StatusChart.vue";
import SeverityChart from "@/components/cards/SeverityChart.vue";
import ComplianceChart from "@/components/cards/ComplianceChart.vue";
import { Filter, NistMapState } from "@/store/data_filters";
import { ControlStatus, Severity } from "inspecjs";
import { FileID } from "@/store/report_intake";

// We declare the props separately
// to make props types inferrable.
const ResultsProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    StatusCardRow,
    Treemap,
    ControlTable,
    StatusChart,
    SeverityChart,
    ComplianceChart
  }
})
export default class Results extends ResultsProps {
  /**
   * The currently selected severity, as modeled by the severity chart
   */
  severityFilter: Severity | null = null;

  /**
   * The currently selected status, as modeled by the status chart
   */
  statusFilter: ControlStatus | null = null;

  /**
   * The current state of the treemap as modeled by the treemap (duh).
   * Once can reliably expect that if a "deep" selection is not null, then its parent should also be not-null.
   */
  nistFilters: NistMapState = {
    selectedFamily: null,
    selectedCategory: null,
    selectedControlID: null
  };

  /**
   * The current search term, as modeled by <NOTHING YET>
   * Never empty - should in that case be null
   */
  searchTerm: string | null = null;

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get fileFilter(): FileID | null {
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
    // console.log(`New filter: status = ${this.statusFilter}, severity = ${this.severityFilter}, fromFile = ${this.fileFilter}`);
    return {
      status: this.statusFilter || undefined,
      severity: this.severityFilter || undefined,
      fromFile: this.fileFilter || undefined,
      nist_filters: this.nistFilters,
      omit_overlayed_controls: true
    };
  }

  /**
   * The filter for treemap. Omits its own stuff
   */
  get treemap_filter(): Filter {
    // console.log(`New filter: status = ${this.statusFilter}, severity = ${this.severityFilter}, fromFile = ${this.fileFilter}`);
    return {
      status: this.statusFilter || undefined,
      severity: this.severityFilter || undefined,
      fromFile: this.fileFilter || undefined,
      omit_overlayed_controls: true
    };
  }

  /**
   * Clear all filters
   */
  clear() {
    this.severityFilter = null;
    this.statusFilter = null;
    this.searchTerm = null;
    this.nistFilters = {
      selectedFamily: null,
      selectedCategory: null,
      selectedControlID: null
    };
  }
}
</script>

<!--
<style scoped>
.card {
  overflow: hidden;
  flex-grow: 1;
  height: 107%; /*ehhh*/
}
</style>
-->
