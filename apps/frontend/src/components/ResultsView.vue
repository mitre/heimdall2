<template>
  <v-container fluid grid-list-md pa-2>
    <!-- Count Cards -->
    <StatusCardRow />

    <!-- Compliance Cards -->
    <v-row justify="space-around">
      <v-col xs-4>
        <v-card class="fill-height">
          <v-card-title>Status Counts</v-card-title>
          <v-card-text>
            <StatusChart
              :filter="filter"
              v-on:filter-status="setStatusFilter"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col xs-4>
        <v-card class="fill-height">
          <v-card-title>Severity Counts</v-card-title>
          <v-card-text>
            <SeverityChart
              :filter="filter"
              v-on:filter-severity="setSeverityFilter"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col xs-4>
        <v-card class="fill-height">
          <v-card-title>Compliance Level</v-card-title>
          <v-card-text>
            <ComplianceChart :filter="filter" />[Passed/(Passed + Failed + Not
            Reviewed + Profile Error) * 100]
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- TreeMap and Partition Map -->
    <v-row>
      <v-col xs-12>
        <v-card elevation="2" title="test">
          <v-card-title>TreeMap</v-card-title>
          <v-card-text>WIP</v-card-text>
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
import TreeMap from "@/components/TreeMap.vue";
import ControlTable from "@/components/ControlTable.vue";
import StatusChart from "@/components/cards/StatusChart.vue";
import SeverityChart from "@/components/cards/SeverityChart.vue";
import ComplianceChart from "@/components/cards/ComplianceChart.vue";
import { Filter } from "../store/data_filters";
import { ControlStatus, Severity } from "inspecjs";

// We declare the props separately
// to make props types inferrable.
const ResultsProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    StatusCardRow,
    TreeMap,
    ControlTable,
    StatusChart,
    SeverityChart,
    ComplianceChart
  }
})
export default class Results extends ResultsProps {
  // Stores the current filter
  filter: Filter = {};

  setSeverityFilter(newSeverity: Severity): void {
    // If they've picked the same one, we reset to undefined.
    // Otherwise, we set it as the new filter
    let newFilter = { ...this.filter };
    if (newSeverity === this.filter.severity) {
      newFilter.severity = undefined;
    } else {
      newFilter.severity = newSeverity;
    }
    this.filter = newFilter;
  }

  setStatusFilter(newStatus: ControlStatus): void {
    // If they've picked the same one, we reset to undefined.
    // Otherwise, we set it as the new filter
    let newFilter = { ...this.filter };
    if (newStatus === this.filter.status) {
      newFilter.status = undefined;
    } else {
      newFilter.status = newStatus;
    }
    this.filter = newFilter;
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
