<template>
  <v-container ref="complianceContainer">
    <svg id="complianceGauge" v-resize="on_resize" />

    <v-row
      ><v-col align="center"
        ><h2>{{ compliance }}%</h2></v-col
      ></v-row
    >
  </v-container>
</template>

<script lang="ts">
import {Filter} from '@/store/data_filters';
import {calculateCompliance} from '@/store/status_counts';
import * as d3 from 'd3';
import {SimpleGauge} from 'd3-simple-gauge';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Ref, Watch} from 'vue-property-decorator';

// Respects a v-model of type TreeMapState
@Component({
  components: {}
})
export default class ComplianceChart extends Vue {
  @Ref('complianceContainer') readonly complianceContainer!: Element;
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  gauge: Object & {[key: string]: unknown} = {};

  /** The svg internal coordinate space */
  width = 1300;
  height = 250;

  mounted() {
    this.drawGauge();
  }

  @Watch('filter')
  onUpdateFilter() {
    this.removeGauge();
    this.drawGauge();
    this.gauge.value = this.compliance;
  }

  get compliance(): number {
    return calculateCompliance(this.filter);
  }

  removeGauge() {
    const existingComplianceGuage = document.querySelector('#complianceGauge');
    while (existingComplianceGuage?.firstChild) {
      existingComplianceGuage.removeChild(existingComplianceGuage.firstChild);
    }
  }

  drawGauge() {
    const svg = d3
      .select('#complianceGauge')
      .attr('width', this.width)
      .attr('height', this.height);

    this.gauge = new SimpleGauge({
      el: svg.append('g'), // The element that hosts the gauge
      easeType: d3.easeQuad,
      height: 200, // The height of the gauge
      interval: [0, 100], // The interval (min and max values) of the gauge (optional)
      animationDuration: 1000,
      sectionsCount: 20, // The number of sections in the gauge
      sectionsColors: [
        '#f84434',
        '#f24f29',
        '#ec591d',
        '#e5620f',
        '#de6a00',
        '#d67200',
        '#ce7900',
        '#c57f00',
        '#bc8500',
        '#b38a00',
        '#aa8f00',
        '#a19300',
        '#989800',
        '#8e9b05',
        '#849f18',
        '#7ba226',
        '#71a532',
        '#66a73e',
        '#5caa49',
        '#50ac54'
      ],
      needleRadius: 0,
      barWidth: 20,
      width: this.complianceContainer.clientWidth // The width of the gauge
    });

    this.gauge.value = this.compliance;

    // Remove bars from the graph based on the compliance percentage
    const gaugeBars = document.querySelectorAll('#complianceGauge .arc');
    const complianceScore = this.compliance / 5;
    gaugeBars.forEach((bar, index) => {
      if (index > complianceScore) {
        bar.remove();
      }
    });
  }

  on_resize() {
    this.removeGauge();
    this.width = this.complianceContainer.clientWidth;
    this.drawGauge();
  }
}
</script>
