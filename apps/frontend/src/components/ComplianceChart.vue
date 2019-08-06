<template>
  <v-card no-body class="mb-3">
    <v-card-title>
      <font-awesome-icon icon="tachometer-alt" />Compliance
      <div v-bind:title="testBind"></div>
    </v-card-title>
    <v-card-text>
      [Passed/(Passed + Failed + Not Reviewed + Profile Error) * 100]
      <vue-c3 :handler="handler"></vue-c3>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// Untype import
let VueC3: any = require("vue-c3");
//import VueApexCharts from 'vue-apexcharts'

// We declare the props separately to make props types inferable.
const ComplianceChartProps = Vue.extend({
  props: {
    propMessage: String
  }
});

@Component({
  components: {
    VueC3
  }
})
export default class ComplianceChart extends ComplianceChartProps {
  // Create a small vue instance to handle our C3 chart
  private chartHandler: Vue = new Vue();

  get testBind(): string {
    return "???? What in the world is this meant to be";
  }

  get compliance(): Array<[String, number]> {
    return [["Alpha", 0], ["Beta", 1]];
  }

  // Lifecycle hook
  mounted() {
    // Create our options hash to init the graph:
    const options = {
      data: {
        columns: this.compliance,
        type: "gauge"
      },
      color: {
        pattern: ["#FF0000", "#F97600", "#F6C600", "#60B044"],
        threshold: {
          values: [30, 60, 90, 100]
        }
      },
      size: {
        height: 270
      }
    };
    this.chartHandler.$emit("init", options);
  }

  updated() {
    const reload_data = {
      unload: true,
      columns: this.compliance
    };
    this.chartHandler.$emit("dispatch", (chart: any) =>
      chart.load(reload_data)
    );
  }
}
</script>
<style>
.c3-chart-arcs-background {
  fill: #e0e0e0;
  stroke: none;
}
</style>
