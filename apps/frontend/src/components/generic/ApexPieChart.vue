<template>
  <div slot="no-body">
    <vue-apex-charts
      type="donut"
      :width="350"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import VueApexCharts from 'vue-apexcharts';
import {ApexOptions} from 'apexcharts';
import {Prop} from 'vue-property-decorator';
import {ColorHackModule} from '@/store/color_hack';

// Represents a slice of the pie.
export interface Category<C extends string> {
  label: string;
  value: C;
  color: string;
}

// Options for Apex Total in donut chart
type ApexTotalType = {
  show?: boolean;
  showAlways?: boolean;
  fontFamily?: string;
  fontWeight?: string | number;
  fontSize?: string;
  label?: string;
  color?: string;
  formatter?(w: any): string;
};

/**
 * Emits "category-selected" with payload of type Category whenever a category is selected.
 */
@Component({
  components: {
    VueApexCharts
  }
})
export default class ApexPieChart extends Vue {
  @Prop({required: true, type: Array}) readonly categories!: Category<string>[];
  @Prop({required: true, type: Array}) readonly series!: number[];
  @Prop({required: false, type: String}) readonly centerValue!: string;

  // Generate the chart options based on categories
  get chartOptions(): ApexOptions {
    // This prevents code duplication to use the default behavior of ApexCharts if the total needs to be calculated.
    let totalHash: ApexTotalType = {
      show: true,
      color: '#008FFB'
    };

    if (this.centerValue) {
      totalHash = {
        ...totalHash,
        label: 'Compliance',
        formatter: () => {
          return this.centerValue;
        }
      };
    }

    return {
      labels: this.categories.map((cat) => cat.label),
      dataLabels: {
        formatter: (val, opts) => opts.w.config.series[opts.seriesIndex]
      },
      legend: {
        position: 'bottom',
        onItemClick: {
          toggleDataSeries: true
        },
        labels: {
          useSeriesColors: true
        }
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              name: {
                show: true,
                color: undefined
              },
              value: {color: '#99a2ac'},
              total: totalHash
            }
          }
        }
      },
      chart: {
        type: 'donut',
        toolbar: {
          show: false
        },
        events: {
          dataPointSelection: (_event, _chartContext, config) => {
            this.$emit(
              'category-selected',
              this.categories[config.dataPointIndex]
            );
          },
          dataPointMouseEnter: (_event) => {
            document.body.style.cursor = 'pointer';
          },
          dataPointMouseLeave: (_event) => {
            document.body.style.cursor = 'default';
          }
        },
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 3,
          opacity: 0.35
        }
      },
      stroke: {width: 0},
      // Apex charts does not support color names; must use color hack module
      colors: this.categories.map((cat) =>
        ColorHackModule.lookupColor(cat.color)
      )
    };
  }
}
</script>

<style scoped>
svg {
  fill: currentColor;
}
</style>
