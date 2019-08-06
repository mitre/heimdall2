<template>
  <vx-card title="Control Status" :subtitle="subtitle" class="card">
    <div slot="no-body">
      <vue-apex-charts
        id="chart"
        ref="chart"
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
        { condition: "Passed", icon: "CheckCircleIcon", color: "success" },
        { condition: "Failed", icon: "XCircleIcon", color: "danger" },
        { condition: "Not Applicable", icon: "SlashIcon", color: "primary" },
        {
          condition: "Not Reviewed",
          icon: "AlertTriangleIcon",
          color: "warning"
        },
        { condition: "Profile Error", icon: "AlertCircleIcon", color: "dark" }
      ],
      chartOptions: {
        plotOptions: {
          pie: {
            size: 140,
            customScale: 0.8
          }
        },
        labels: [
          "Passed",
          "Failed",
          "Not Applicable",
          "Not Reviewed",
          "Profile Error"
        ],
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
                case 0: //Passed
                  this.filterResults("Passed");
                  break;
                case 1: //Failed
                  this.filterResults("Failed");
                  break;
                case 2: //Not Applicable
                  this.filterResults("Not Applicable");
                  break;
                case 3: //Not Reviewed
                  this.filterResults("Not Reviewed");
                  break;
                default:
                  //Profile Error
                  this.filterResults("Profile Error");
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
        colors: ["#28C76F", "#EA5455", "#7367F0", "#FF9F43", "#1E1E1E"]
      }
    };
  },
  methods: {
    filterResults(status) {
      this.$emit("apply-filter", status);
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

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-grow: 1;
  height: 100%;
}
</style>
