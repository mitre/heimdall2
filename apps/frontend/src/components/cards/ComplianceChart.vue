<template>
  <div slot="no-body">
    <!-- Show chart if we have valid data -->
    <vue-apex-charts
      v-if="hasSeries"
      id="chart"
      type="radialBar"
      width="350"
      :options="chartOptions"
      :series="series"
    />

    <!-- Fallback message if data is missing -->
    <div v-else style="text-align: center; padding: 1rem; color: #666">
      <p>No compliance data to display.</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {ApexOptions} from 'apexcharts';
import VueApexCharts from 'vue-apexcharts';

import {ColorHackModule} from '@/store/color_hack';
import {Filter} from '@/store/data_filters';
import {calculateCompliance} from '@/store/status_counts';
import {formatCompliance} from '@mitre/hdf-converters';

@Component({
  components: {
    VueApexCharts
  }
})
export default class ComplianceChart extends Vue {
  @Prop({type: Object, default: () => ({})}) readonly filter!: Filter;

  /**
   * Checks whether the chart has a valid non-empty data series.
   *
   * This is used to conditionally render the chart only when there is
   * meaningful data available.
   *
   * Returns:
   *   - true if series is an array with one or more elements
   *   - otherwise false.
   */
  get hasSeries(): boolean {
    return Array.isArray(this.series) && this.series.length > 0;
  }

  /**
   * Generate the series (percentage decimal score value) from the given filter
   * It should always be a single value to prevent chart rendering failures.
   */
  get series(): number[] {
    try {
      const val = calculateCompliance(this.filter);
      if (isNaN(val) || typeof val !== 'number') return [];
      return [val];
    } catch (e) {
      return [];
    }
  }

  /**
   * Generate the ApexChart configuration options for rendering a radial bar
   * chart representing compliance level (or score).
   *
   * The compliance color is determined based on the current score:
   *   - **Red** (`complianceLow`) for scores less than 60
   *   - **Yellow** (`complianceMedium`) for scores between 60 and 89
   *   - **Green** (`complianceHigh`) for scores 90 and above
   *
   * The chart is styled with a radial arc from -150° to 150°, with a hollow center
   * and drop shadow. Data labels are customized for styling and value formatting.
   *
   * Returns:
   *  - An ApexOptions object for configuring the chart's appearance, including
   *    colors, labels, and visual effects.
   */
  get chartOptions(): ApexOptions {
    // The original code was setting the color inside the fill colors attribute.
    // This was periodically causing an Apex Chart error:
    //   Cannot read properties of undefined (reading 'length')
    // To solve the issue the code was move here ans checked for proper value.
    const val = this.series[0];
    let complianceColor = '#f44336'; // fallback default

    if (typeof val === 'number') {
      if (val < 60) {
        complianceColor = ColorHackModule.lookupColor('complianceLow');
      } else if (val < 90) {
        complianceColor = ColorHackModule.lookupColor('complianceMedium');
      } else {
        complianceColor = ColorHackModule.lookupColor('complianceHigh');
      }
    }

    return {
      // Radial center label (shows above the percentage score)
      labels: ['Score'],

      // Basic chart settings including drop shadow
      chart: {
        type: 'radialBar',
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 3,
          opacity: 0.35
        }
      },

      // Configure radial bar specific options
      plotOptions: {
        radialBar: {
          startAngle: -150, // Start angle of the semi-circle sweep
          endAngle: 150, // End angle of the semi-circle sweep
          hollow: {
            size: '70%' // Makes a donut-style inner hole
          },
          track: {
            opacity: 0 // Hides the track background
          },
          dataLabels: {
            show: true,
            name: {
              show: true,
              offsetY: -40, // Align with Status and Severity
              color: '#008FFB',
              fontSize: '1.5rem'
            },
            value: {
              show: true,
              offsetY: -15, // Align with Status and Severity
              color: '#99a2ac',
              fontSize: '2rem',
              formatter: (val: number) => formatCompliance(val)
            }
          }
        }
      },

      // Solid fill color for the radial bar, dynamically assigned based on compliance
      fill: {
        type: 'solid',
        colors: [complianceColor]
      },

      // Dashed stroke around the radial bar
      stroke: {
        dashArray: 8
      }
    };
  }
}
</script>
