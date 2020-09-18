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

/**
 * Emits "category-selected" with payload of type Category whenever a category is selected.
 */
@Component({
  components: {
    VueApexCharts
  }
})
export default class ApexPieChart extends Vue {
  @Prop({required: true}) readonly categories!: Category<string>[];
  @Prop({required: true}) readonly series!: Number[];

  // Generate the chart options based on categories
  get chartOptions(): ApexOptions {
    return {
      labels: this.categories.map(cat => cat.label),
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
              total: {
                show: true,
                color: '#008FFB'
              }
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
          dataPointMouseEnter: _event => {
            document.body.style.cursor = 'pointer';
          },
          dataPointMouseLeave: _event => {
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
      colors: this.categories.map(cat => ColorHackModule.lookupColor(cat.color))
    };
  }
}
</script>

<style scoped>
svg {
  fill: currentColor;
}
</style>
