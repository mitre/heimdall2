<template>
  <v-container ref="treemapContainer" fluid>
    <v-row dense>
      <v-col :cols="4">
        NIST SP 800-53 Security and Privacy Control Coverage
      </v-col>
      <v-col :cols="8">
        <v-btn
          :disabled="currentSelectedLeaf === null"
          block
          x-small
          @click="
            currentSelectedLeaf = null;
            syncedSelectedControl = null;
            onSubcategoryPage = false;
          "
        >
          <v-icon v-if="!currentSelectedLeaf === null"> mdi-arrow-left </v-icon>
          {{
            'NIST-SP-800-53 ' +
            (currentSelectedLeaf ? '-> ' + currentSelectedLeaf : '')
          }}
        </v-btn>
      </v-col>
    </v-row>
    <vue-apex-charts
      id="chart"
      :options="chartOptions"
      :series="series"
      height="650"
    />
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import VueApexCharts from 'vue-apexcharts';
import {ApexOptions} from 'apexcharts';
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {ColorHackModule} from '@/store/color_hack';
import {Prop} from 'vue-property-decorator';
import {ContextualizedControl} from 'inspecjs';
import {StatusCountModule} from '../../../store/status_counts';
import {SearchModule} from '../../../store/search';

export interface LeafData {
  x: string,
  y: number;
  color: string;
}

// Respects a v-model of type TreeMapState
@Component({
  components: {VueApexCharts}
})
export default class Treemap extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  currentSelectedLeaf: string | null = null;
  onSubcategoryPage = false;

  get series(): ApexAxisChartSeries {
    // If we don't have any files currently loaded, show all NIST categories
    if (this.filter.fromFile.length === 0) {
      return ['AC', 'AU', 'AT', 'CM', 'CP', 'IA', 'IR', 'MA', 'MP', 'PS', 'PE', 'PL', 'PM', 'RA', 'CA', 'SC', 'SI', 'SA', 'UM'].map((nistControl) => {
        return {
          name: nistControl,
          color: 'black',
          data: [
            {x: nistControl, y: 1, compliance: 0}
          ]
        }
      })
    } else {
      // If we have a selected value and are on the subcategory page
      if(this.onSubcategoryPage && this.currentSelectedLeaf) {
        const controls = FilteredDataModule.controls({fromFile: this.filter.fromFile, nistFilter: this.currentSelectedLeaf});
        return this.controlsToNISTSeries(controls, true, this.currentSelectedLeaf)
      } // If we have selected both a category and subcategory
      else if (this.currentSelectedLeaf && !this.onSubcategoryPage) {
        const controls = FilteredDataModule.controls({fromFile: this.filter.fromFile, nistFilter: this.currentSelectedLeaf});
        return this.controlsFromNISTSeries(controls)
      } // If we have no selection on the treemap
      else {
        const controls = FilteredDataModule.controls({fromFile: this.filter.fromFile});
        return this.controlsToNISTSeries(controls, false)
      }
    }
  }

  controlsToNISTSeries(contextualizedControls: Readonly<ContextualizedControl[]>, showSubcategory: boolean, exactMatch?: string): ApexAxisChartSeries {
    const series: ApexAxisChartSeries = []
    contextualizedControls.forEach((cc) => {
      for (const tag of cc.root.hdf.parsed_nist_tags) {
        // Changes if we're showing the sub-category, e.g for "AC-4 (a)": showSubcategory ? 'AC-4' : 'AC'
        const nistID = showSubcategory ? tag.raw_text?.substring(0, 5).replace(/\s|\(|\)/, '') : tag.raw_text?.substring(0, 2)
        if(exactMatch && nistID?.indexOf(exactMatch) === -1) {
          continue;
        }
        if (nistID && !series.some((value) => value.name === nistID)){
          const complianceScore = this.calculateComplianceForNISTSeries(nistID)
          series.push({name: nistID, data: [
            {
              x: nistID,
              y: 1,
              fillColor: this.calculateComplianceColor(complianceScore),
              strokeColor: 'white'
            }
          ]})
        }
      }
    })
    return series
  }

  controlsFromNISTSeries(
    contextualizedControls: Readonly<ContextualizedControl[]>
  ) {
    const series: ApexAxisChartSeries = []
    contextualizedControls.flatMap((cc) => {
      series.push({
        name: cc.data.id,
        data: [
          {
            x: cc.data.id,
            y: 1,
            fillColor: ColorHackModule.colorForStatus(cc.hdf.status),
            strokeColor: 'white'
          }
        ]
      })
    })
    return series;
  }

  get chartOptions(): ApexOptions {
    return {
      legend: {
        show: false
      },
      tooltip: {
        enabled: false
      },
      chart: {
        toolbar: {
          show: false
        },
        animations: {
          easing: 'linear',
          speed: 4
        },
        type: 'treemap',
        events: {
          dataPointSelection: (_event, _chartContext, config) => {
            const selectedValue = this.series[config.seriesIndex].name
            if(!this.currentSelectedLeaf && !this.onSubcategoryPage) {
              this.currentSelectedLeaf = selectedValue || 'UM'
              this.onSubcategoryPage = true;
            } else if (this.onSubcategoryPage) {
              this.currentSelectedLeaf = selectedValue || 'UM'
              this.onSubcategoryPage = false
            }
            else {
              if(selectedValue) {
                if (SearchModule.controlIdSearchTerms.indexOf(selectedValue.toLowerCase()) === -1){
                  SearchModule.addIdSearch(selectedValue)
                } else {
                  SearchModule.removeIdSearch(selectedValue)
                }
              }
            }
          }
        }
      },
      stroke: {
        colors: [
          'black'
        ]
      }
    }
  }

  calculateComplianceColor(compliance: number): string {
    const hue = Math.round(compliance);
    return ["hsl(", hue, ", 80%, 50%, 75%)"].join("");
  }

  calculateComplianceForNISTSeries(series: string) {
    const passed = StatusCountModule.countOf({fromFile: this.filter.fromFile, nistFilter: series}, 'Passed');
    const total =
      passed +
      StatusCountModule.countOf({fromFile: this.filter.fromFile, nistFilter: series}, 'Failed') +
      StatusCountModule.countOf({fromFile: this.filter.fromFile, nistFilter: series}, 'Profile Error') +
      StatusCountModule.countOf({fromFile: this.filter.fromFile, nistFilter: series}, 'Not Reviewed') +
      StatusCountModule.countOf({fromFile: this.filter.fromFile, nistFilter: series}, 'Waived');
    if(total === 0) {
      return 0
    } else {
      return Math.round((100.0 * passed) / total);
    }
  }
}
</script>

<style>
.apexcharts-data-labels {
  inline-size: 150px;
  overflow-wrap: break-word;
}
.apexcharts-datalabel {
  fill: white !important;
}
</style>
