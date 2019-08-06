<template>
  <vx-card title="Control Severity" :subtitle="subtitle" class="card">
    <div slot="no-body">
      <vue-apex-charts
        id="chart"
        type="donut"
        height="300"
        :options="chartOptions"
        :series="series"
      />
    </div>
  </vx-card>
</template>

<script>
import VueApexCharts from "vue-apexcharts";

export default {
  data() {
    return {
      categories: [
        { condition: "Low", icon: "SquareIcon", color: "success" },
        { condition: "Medium", icon: "SquareIcon", color: "warning" },
        { condition: "High", icon: "SquareIcon", color: "danger" },
        { condition: "Critical", icon: "SquareIcon", color: "dark" }
      ],
      chartOptions: {
        plotOptions: {
          pie: {
            size: 140,
            customScale: 0.8
          }
        },
        labels: ["Low", "Medium", "High", "Critical"],
        dataLabels: {
          formatter: function(val, opts) {
            return opts.w.config.series[opts.seriesIndex];
          }
        },
        legend: {
          position: "bottom",
          offsetY: 25
        },
        chart: {
          offsetY: 30,
          type: "donut",
          toolbar: {
            show: false
          },
          events: {
            dataPointSelection: (event, chartContext, config) => {
              switch (config.dataPointIndex) {
                case 0: //Low
                  this.filterResults("low");
                  break;
                case 1: //Medium
                  this.filterResults("medium");
                  break;
                case 2: //High
                  this.filterResults("high");
                  break;
                case 3: //Critical
                  this.filterResults("critical");
                  break;
              }
            },
            dataPointMouseEnter: (event, chartContext, config) => {
              document.body.style.cursor = "pointer";
            },
            dataPointMouseLeave: (event, chartContext, config) => {
              document.body.style.cursor = "default";
            }
          },
          dropShadow: {
            //for dark mode
            enabled: true,
            enabledOnSeries: undefined,
            top: 0,
            left: 0,
            blur: 3,
            color: "#fff",
            opacity: 0.35
          }
        },
        stroke: { width: 0 },
        colors: ["#28C76F", "#FF9F43", "#EA5455", "#1E1E1E"]
      }
    };
  },
  methods: {
    filterResults(impact) {
      this.$emit("apply-filter", impact);
    }
  },
  props: {
    series: Array,
    subtitle: String
  },
  components: {
    VueApexCharts
  }
};
</script>

<style>
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-grow: 1;
  height: 100%;
}
</style>
