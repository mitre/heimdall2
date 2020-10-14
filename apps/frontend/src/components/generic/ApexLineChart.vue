<template>
  <div style="color: black">
    <vue-apex-charts
      type="line"
      height="350"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script lang="ts">
import Vue, {PropType} from 'vue';
import Component from 'vue-class-component';
import VueApexCharts from 'vue-apexcharts';
import {ApexOptions} from 'apexcharts';

// We declare the props separately to make props types inferable.
const ApexLineChartProps = Vue.extend({
  props: {
    categories: {
      type: Array as PropType<string[]>,
      validator: (value) => {
        return value.every((element) => typeof element === 'string');
      }
    }, // Should be of type string[]
    series: {
      type: Array as PropType<SeriesItem[]>,
      validator: (value) => {
        return value.every((element) => typeof element === 'object');
      }
    }, // Should be of type object[]
    upper_range: Number, //upper bound of y axis
    sev_chart: Boolean, //identifies chart as severity chart
    title: String,
    y_title: String
  }
});

let id_counter = 0;
function next_id(): number {
  id_counter += 1;
  return id_counter;
}

export interface SeriesItem {
  name: string;
  data: number[];
}

/**
 * Emits "category-selected" with payload of type Category whenever a category is selected.
 */
@Component({
  components: {
    VueApexCharts
  }
})
export default class ApexLineChart extends ApexLineChartProps {
  chart_id: string = `line_chart_${next_id}`;

  get label_colors(): string[] {
    let colors = [];
    for (let i = 0; i < this.categories.length; i++) {
      colors.push('#FFFFFF');
    }
    return colors;
  }

  //creates differing number of ticks based on number of controls
  get y_axis_tick(): number {
    if (this.upper_range < 15) {
      return this.upper_range;
    } else if (this.upper_range < 50) {
      return Math.floor(this.upper_range / 5);
    } else {
      return Math.floor(this.upper_range / 10);
    }
  }

  //gives apex charts the severity colors
  get sev_colors(): string[] {
    return new Array('#FFEB3B', '#FF9800', '#FF5722', '#F44336');
  }

  get line_colors(): string[] | undefined {
    if (this.sev_chart) {
      return this.sev_colors;
    }
    return undefined;
  }

  // Generate the chart options based on _categories
  get chartOptions(): ApexOptions {
    return {
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false
        }
        //background: '#000'
      },
      colors: this.line_colors,
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 5,
        curve: 'straight'
      },
      title: {
        text: this.title,
        align: 'left',
        style: {
          fontFamily: 'Arial Black',
          fontSize: '14px',
          color: '#FFFFFF'
        }
      },
      legend: {
        labels: {
          useSeriesColors: true
        }
      },
      xaxis: {
        categories: this.categories,
        labels: {
          style: {
            colors: this.label_colors
          }
        }
      },
      yaxis: {
        min: 0,
        max: this.upper_range,
        tickAmount: this.y_axis_tick,
        axisTicks: {
          color: '#FF0000'
        },
        axisBorder: {
          show: true,
          color: '#FFFFFF',
          offsetX: 0,
          offsetY: 0
        },
        title: {
          text: this.y_title,
          style: {
            color: '#FFFFFF'
          }
        },
        labels: {
          style: {
            colors: '#FFFFFF'
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1'
      }
    };
  }
}
</script>
