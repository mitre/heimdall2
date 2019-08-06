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

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import VueApexCharts from "vue-apexcharts";
// import { ApexOptions } from "vue-apexcharts/typings";

interface Category {
  condition: string;
  icon: string;
  color: string;
}

function isCategory(x: any): x is Category {
  return (
    x.condition !== undefined && x.icon !== undefined && x.color !== undefined
  );
}

// We declare the props separately to make props types inferable.
const ApexPieChartProps = Vue.extend({
  props: {
    categories: Array
  }
});

@Component({
  components: {
    VueApexCharts
  }
})
export default class ApexPieChart extends ApexPieChartProps {
  // We should probably type check these
  get _categories(): Category[] {
    this._categories.forEach(element => {
      if (!isCategory(element)) {
        throw `Invalid category ${element}`;
      }
    });
    return this.categories as Category[];
  }

  get chartOptions(): any {
    return {
      plotOptions: {
        pie: {
          size: 140,
          customScale: 0.8
        }
      },
      labels: this._categories.map(cat => cat.condition),
      dataLabels: {
        formatter: function(val: any, opts: any) {
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
          dataPointSelection: (event: any, chartContext: any, config: any) =>
            this._categories[config.dataPointIndex],
          dataPointMouseEnter: (event: any, chartContext: any, config: any) => {
            document.body.style.cursor = "pointer";
          },
          dataPointMouseLeave: (event: any, chartContext: any, config: any) => {
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
      colors: this._categories.map(cat => cat.color)
    };
  }

  filterResults(status: Category) {
    this.$emit("apply-filter", status);
  }
}
</script>
