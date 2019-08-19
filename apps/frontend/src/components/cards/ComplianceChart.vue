<template>
  <div slot="no-body">
    <vue-apex-charts
      id="chart"
      type="radialBar"
      width="350"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import VueApexCharts from "vue-apexcharts";
import { getModule } from "vuex-module-decorators";
import ColorHackModule from "../../store/color_hack";
import FilteredDataModule, { Filter } from "@/store/data_filters";
import { ControlStatus, Severity } from "inspecjs";
import { ApexOptions } from "apexcharts";
import InspecDataModule from "../../store/data_store";
import StatusCountModule from "../../store/status_counts";

// We declare the props separately
// to make props types inferrable.
const ComplianceChartProps = Vue.extend({
  props: {
    filter: Object // Of type Filer from filteredData
  }
});

@Component({
  components: {
    VueApexCharts
  }
})
export default class ComplianceChart extends ComplianceChartProps {
  get chartOptions(): ApexOptions {
    // Get our color module
    let colors = getModule(ColorHackModule, this.$store);

    // Produce our options
    let result: ApexOptions = {
      plotOptions: {
        radialBar: {
          startAngle: -150,
          endAngle: 150,
          hollow: {
            size: "70%"
          },
          track: {
            opacity: 0
          },
          dataLabels: {
            show: true,
            value: {
              color: "#99a2ac",
              fontSize: "2rem"
            }
          }
        }
      },
      fill: {
        type: "solid",
        colors: [
          function(data: { value: number }) {
            if (data.value < 60) {
              return colors.lookupColor("complianceLow");
            } else if (data.value >= 60 && data.value < 90) {
              return colors.lookupColor("complianceMedium");
            } else {
              return colors.lookupColor("complianceHigh");
            }
          }
        ]
      },
      chart: {
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 3,
          opacity: 0.35
        }
      },
      stroke: {
        dashArray: 8
      },
      labels: ["Compliance Level"]
    };
    return result;
  }

  /**
   * We actuall generate our series ourself! This is what shows up in the chart. It should be a single value
   */
  get series(): number[] {
    // Get access to the status counts, to compute compliance percentages
    let counts = getModule(StatusCountModule, this.$store);
    let passed = counts.passed(this.filter);
    let total =
      passed +
      counts.failed(this.filter) +
      counts.profileError(this.filter) +
      counts.notReviewed(this.filter);
    if (total == 0) {
      return [0];
    } else {
      return [Math.round((100.0 * passed) / total)];
    }
  }
}
</script>

<!--
<style scoped>
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-grow: 1;
  height: 107%; /*ehhh*/
}
</style>
-->
