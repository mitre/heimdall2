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
import Vue from 'vue';
import Component from 'vue-class-component';
import VueApexCharts from 'vue-apexcharts';
import {ApexOptions} from 'apexcharts';
import {Category} from './ApexPieChart.vue';
import {Prop} from 'vue-property-decorator';

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
export default class ApexLineChart extends Vue {
  @Prop({required: true, type: Array}) readonly categories!: Category<string>[];
  @Prop({required: true, type: Array}) readonly series!: number[];
  @Prop({type: Number}) readonly upperRange!: number; //upper bound of y axis
  @Prop({type: Boolean}) readonly sevChart!: boolean; //identifies chart as severity chart
  @Prop({type: String}) readonly title!: string;
  @Prop({type: String}) readonly yTitle!: string;

  //gives apex charts the severity colors
  sevColors: string[] = ['#FFEB3B', '#FF9800', '#FF5722', '#F44336'];

  get label_colors(): string[] {
    const colors = [];
    for (let i = 0; i < this.categories.length; i++) {
      colors.push('#FFFFFF');
    }
    return colors;
  }

  //creates differing number of ticks based on number of controls
  get y_axis_tick(): number {
    if (this.upperRange < 15) {
      return this.upperRange;
    } else if (this.upperRange < 50) {
      return Math.floor(this.upperRange / 5);
    } else {
      return Math.floor(this.upperRange / 10);
    }
  }

  get line_colors(): string[] | undefined {
    if (this.sevChart) {
      return this.sevColors;
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
        max: this.upperRange,
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
          text: this.yTitle,
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
