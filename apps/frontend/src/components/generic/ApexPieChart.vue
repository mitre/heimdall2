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
import { ApexOptions } from 'apexcharts';
import Vue from 'vue';
import VueApexCharts from 'vue-apexcharts';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { ColorHackModule } from '@/store/color_hack';
import { SeriesItem } from './ApexLineChart.vue';

// Represents a slice of the pie.
export type Category<C extends string> = {
  color: string;
  label: string;
  value: C;
};

// Options for Apex Total in donut chart
type ApexTotalType = {
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number | string;
  // Formatter can take any parameter as defined by ApexCharts

  formatter?(w: any): string;
  label?: string;
  show?: boolean;
  showAlways?: boolean;
};

/**
 * Emits "category-selected" with payload of type Category whenever a category is selected.
 */
@Component({ components: { VueApexCharts } })
export default class ApexPieChart extends Vue {
  @Prop({ required: true, type: Array }) readonly categories!: Category<string>[];
  @Prop({ required: false, type: String }) readonly centerValue!: string;
  @Prop({ required: true, type: Array }) readonly series!: SeriesItem[];

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
      color: '#008FFB',
      show: true,
    };

    // If a center value is provided, override default total label
    // with custom label and formatter (used with the comparison view)
    if (this.centerValue) {
      totalHash = {
        ...totalHash,
        formatter: () => {
          return this.centerValue;
        },
        label: 'Compliance',
      };
    }

    // Adjust vertical label positioning when rendering the normal view
    const donutLabelOffsetY = this.centerValue === undefined ? -25 : -12;
    const donutValueOffsetY = this.centerValue === undefined ? -2 : 10;

    return {
      // Define chart type and interactive behavior
      chart: {
        // Apply drop shadow for visual depth
        dropShadow: {
          blur: 3,
          enabled: true,
          left: 0,
          opacity: 0.35,
          top: 0,
        },
        events: {
          // Change cursor to pointer on hover
          dataPointMouseEnter: (_event) => {
            document.body.style.cursor = 'pointer';
          },
          // Restore default cursor on mouse leave
          dataPointMouseLeave: (_event) => {
            document.body.style.cursor = 'default';
          },
          // Emit selected category when a chart segment is clicked
          dataPointSelection: (_event, _chartContext, config) => {
            if (!config) {
              throw new Error(
                'Missing configuration options for dataPointSelection',
              );
            }
            this.$emit(
              'category-selected',
              this.categories[config.dataPointIndex],
            );
          },
        },
        toolbar: { show: false },
        type: 'donut',
      },

      // Set custom colors for each segment using a color helper module
      // (ApexCharts does not support named CSS colors)
      colors: this.categories.map(cat =>
        ColorHackModule.lookupColor(cat.color),
      ),

      // Format the data label to show the actual value instead of percentage
      dataLabels: {
        formatter: (val, opts) => {
          if (!opts) {
            throw new Error('Missing configuration options for dataLabels');
          }
          return opts.w.globals.series[opts.seriesIndex];
        },
      },

      // Define chart segment labels based on the category labels
      labels: this.categories.map(cat => cat.label),

      // Enable bottom-positioned legend with clickable toggles and series color usage
      legend: {
        labels: { useSeriesColors: true },
        onItemClick: { toggleDataSeries: true },
        position: 'bottom',
      },

      // Configure donut-specific plot options including center labels
      plotOptions: {
        pie: {
          donut: {
            labels: {
              name: {
                color: undefined,
                offsetY: donutLabelOffsetY, // dynamic offset for center label
                show: true,
              },
              show: true,
              total: totalHash, // total label configuration (either default or custom)
              value: {
                color: '#99a2ac',
                offsetY: donutValueOffsetY, // dynamic offset for center value
              },
            },
          },
        },
      },

      // Disable border stroke around pie slices
      stroke: { width: 0 },
    };
  }
}
</script>

<style scoped>
svg {
  fill: currentColor;
}
</style>
