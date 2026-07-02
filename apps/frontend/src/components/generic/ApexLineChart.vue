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
import { formatCompliance } from '@mitre/hdf-converters';
import { ApexOptions } from 'apexcharts';
import Vue from 'vue';
import VueApexCharts from 'vue-apexcharts';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { Category } from './ApexPieChart.vue';

export type SeriesItem = {
  data: number[];
  name: string;
};

/**
 * Emits "category-selected" with payload of type Category whenever a category is selected.
 */
@Component({ components: { VueApexCharts } })
export default class ApexLineChart extends Vue {
  @Prop({ required: true, type: Array }) readonly categories!: Category<string>[];
  @Prop({ required: true, type: Array }) readonly series!: number[];
  @Prop({ type: Boolean }) readonly sevChart!: boolean; // identifies chart as severity chart
  // gives apex charts the severity colors
  sevColors: string[] = ['#FFEB3B', '#FF9800', '#FF5722', '#F44336'];
  @Prop({ type: String }) readonly title!: string;
  @Prop({ default: undefined, type: Number })
  readonly tooltipMaxDisplayPrecision!: number | undefined;

  @Prop({ type: Number }) readonly upperRange!: number; // upper bound of y axis

  @Prop({ type: String }) readonly yTitle!: string;

  // Generate the chart options based on _categories
  get chartOptions(): ApexOptions {
    return {
      chart: {
        height: 350,
        toolbar: { show: false },
        type: 'line',
        zoom: { enabled: false },
        // background: '#000'
      },
      colors: this.line_colors,
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1' },
      legend: { labels: { useSeriesColors: true } },
      stroke: {
        curve: 'straight',
        width: 5,
      },
      title: {
        align: 'left',
        style: {
          color: '#FFFFFF',
          fontFamily: 'Arial Black',
          fontSize: '14px',
        },
        text: this.title,
      },
      tooltip: {
        y: {
          formatter: val =>
            formatCompliance(val, false, this.tooltipMaxDisplayPrecision),
        },
      },
      xaxis: {
        categories: this.categories,
        labels: { style: { colors: this.label_colors } },
      },
      yaxis: {
        axisBorder: {
          color: '#FFFFFF',
          offsetX: 0,
          offsetY: 0,
          show: true,
        },
        axisTicks: { color: '#FF0000' },
        labels: {
          formatter: val => formatCompliance(val, false, 0),
          style: { colors: '#FFFFFF' },
        },
        max: this.upperRange,
        min: 0,
        tickAmount: this.y_axis_tick,
        title: {
          style: { color: '#FFFFFF' },
          text: this.yTitle,
        },
      },
    };
  }

  get label_colors(): string[] {
    const colors = [];
    for (let i = 0; i < this.categories.length; i++) {
      colors.push('#FFFFFF');
    }
    return colors;
  }

  get line_colors(): string[] | undefined {
    if (this.sevChart) {
      return this.sevColors;
    }
    return undefined;
  }

  // creates differing number of ticks based on number of controls
  get y_axis_tick(): number {
    if (this.upperRange < 15) {
      return this.upperRange;
    } else if (this.upperRange < 50) {
      return Math.floor(this.upperRange / 5);
    } else {
      return Math.floor(this.upperRange / 10);
    }
  }
}
</script>
