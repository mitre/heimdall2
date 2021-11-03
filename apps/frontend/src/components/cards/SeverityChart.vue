<template>
  <v-container ref="severityContainer">
    <D3PieChart :config="chart_config" :datum="chart_data" />
  </v-container>
</template>

<script lang="ts">
import {Filter} from '@/store/data_filters';
import {SeverityCountModule} from '@/store/severity_counts';
import {Severity} from 'inspecjs';
import Vue from 'vue';
import Component from 'vue-class-component';
import {D3PieChart} from 'vue-d3-charts';
import {Prop} from 'vue-property-decorator';
import {SearchModule, valueToSeverity} from '../../store/search';

/**
 * Categories property must be of type Category
 * Model is of type Severity | null - reflects selected severity
 */
@Component({
  components: {
    D3PieChart
  }
})
export default class SeverityChart extends Vue {
  @Prop({type: Array}) readonly value!: Severity[];
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  categories: Category<Severity>[] = [
    {label: 'Low', value: 'low', color: 'severityLow'},
    {
      label: 'Medium',
      value: 'medium',
      color: 'severityMedium'
    },
    {
      label: 'High',
      value: 'high',
      color: 'severityHigh'
    },
    {
      label: 'Critical',
      value: 'critical',
      color: 'severityCritical'
    }
  ];

  get series(): number[] {
    return [
      SeverityCountModule.low(this.filter),
      SeverityCountModule.medium(this.filter),
      SeverityCountModule.high(this.filter),
      SeverityCountModule.critical(this.filter)
    ];
  }

  onSelect(severity: any) {
    // In the case that the values are the same, we want to instead emit null
    if (
      this.value &&
      this.value?.indexOf(valueToSeverity(severity.value)) !== -1
    ) {
      SearchModule.removeSearchFilter({
        field: 'severity',
        value: valueToSeverity(severity.value),
        previousValues: this.value
      });
    } else {
      SearchModule.addSearchFilter({
        field: 'severity',
        value: valueToSeverity(severity.value),
        previousValues: this.value
      });
    }
  }
}
</script>
