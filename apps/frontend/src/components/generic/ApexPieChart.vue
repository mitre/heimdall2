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
import {Prop} from 'vue-property-decorator';
import {ApexOptions} from 'apexcharts';
import VueApexCharts from 'vue-apexcharts';

import {ColorHackModule} from '@/store/color_hack';
import {SeriesItem} from './ApexLineChart.vue';

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
  // Formatter can take any parameter as defined by ApexCharts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  @Prop({required: true, type: Array}) readonly series!: SeriesItem[];
  @Prop({required: false, type: String}) readonly centerValue!: string;

  /**
   * Builds and returns the ApexCharts configuration for a donut chart.
   *  - Dynamically includes center labels if `centerValue` is defined.
   *  - Adjusts vertical offsets for donut chart label alignment.
   *  - Configures interactive behaviors like selection and hover cursor changes.
   *  - Emits 'category-selected' when a chart segment is clicked.
   *  - Applies custom colors using ColorHackModule to meet ApexCharts requirements.
   *  - Uses legend, shadow, and stroke settings for visual consistency.
   */
  get chartOptions(): ApexOptions {
    // Set up default total label configuration for the donut center.
    // This prevents code duplication to use the default behavior of ApexCharts
    // if the total needs to be calculated.
    let totalHash: ApexTotalType = {
      show: true,
      color: '#008FFB'
    };

    // If a center value is provided, override default total label
    // with custom label and formatter (used with the comparison view)
    if (this.centerValue) {
      totalHash = {
        ...totalHash,
        label: 'Compliance',
        formatter: () => {
          return this.centerValue;
        }
      };
    }

    // Adjust vertical label positioning when rendering the normal view
    const donutLabelOffsetY = this.centerValue === undefined ? -25 : -12;
    const donutValueOffsetY = this.centerValue === undefined ? -2 : 10;

    return {
      // Define chart segment labels based on the category labels
      labels: this.categories.map((cat) => cat.label),

      // Format the data label to show the actual value instead of percentage
      dataLabels: {
        formatter: (val, opts) => opts.w.config.series[opts.seriesIndex]
      },

      // Enable bottom-positioned legend with clickable toggles and series color usage
      legend: {
        position: 'bottom',
        onItemClick: {
          toggleDataSeries: true
        },
        labels: {
          useSeriesColors: true
        }
      },

      // Configure donut-specific plot options including center labels
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              name: {
                show: true,
                color: undefined,
                offsetY: donutLabelOffsetY // dynamic offset for center label
              },
              value: {
                color: '#99a2ac',
                offsetY: donutValueOffsetY // dynamic offset for center value
              },
              total: totalHash // total label configuration (either default or custom)
            }
          }
        }
      },

      // Define chart type and interactive behavior
      chart: {
        type: 'donut',
        toolbar: {
          show: false
        },
        events: {
          // Emit selected category when a chart segment is clicked
          dataPointSelection: (_event, _chartContext, config) => {
            this.$emit(
              'category-selected',
              this.categories[config.dataPointIndex]
            );
          },
          // Change cursor to pointer on hover
          dataPointMouseEnter: (_event) => {
            document.body.style.cursor = 'pointer';
          },
          // Restore default cursor on mouse leave
          dataPointMouseLeave: (_event) => {
            document.body.style.cursor = 'default';
          }
        },
        // Apply drop shadow for visual depth
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 3,
          opacity: 0.35
        }
      },

      // Disable border stroke around pie slices
      stroke: {width: 0},

      // Set custom colors for each segment using a color helper module
      // (ApexCharts does not support named CSS colors)
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
