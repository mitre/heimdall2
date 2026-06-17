<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    @category-selected="onSelect"
  />
</template>

<script lang="ts">
import type { Severity } from 'inspecjs';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ApexPieChart, { Category } from '@/components/generic/ApexPieChart.vue';
import type { Filter } from '@/store/data_filters';
import { SeverityCountModule } from '@/store/severity_counts';
import { SearchModule, valueToSeverity } from '../../store/search';

/**
 * Categories property must be of type Category
 * Model is of type Severity | null - reflects selected severity
 */
@Component({ components: { ApexPieChart } })
export default class SeverityChart extends Vue {
  categories: Category<Severity>[] = [
    { color: 'severityNone', label: 'None', value: 'none' },
    { color: 'severityLow', label: 'Low', value: 'low' },
    {
      color: 'severityMedium',
      label: 'Medium',
      value: 'medium',
    },
    {
      color: 'severityHigh',
      label: 'High',
      value: 'high',
    },
    {
      color: 'severityCritical',
      label: 'Critical',
      value: 'critical',
    },
  ];

  @Prop({ required: true, type: Object }) readonly filter!: Filter;

  @Prop({ type: Array }) readonly value!: Severity[];

  get series(): number[] {
    return [
      SeverityCountModule.none(this.filter),
      SeverityCountModule.low(this.filter),
      SeverityCountModule.medium(this.filter),
      SeverityCountModule.high(this.filter),
      SeverityCountModule.critical(this.filter),
    ];
  }

  onSelect(severity: Category<Severity>) {
    // In the case that the values are the same, we want to instead emit null
    if (
      this.value
      && this.value?.indexOf(valueToSeverity(severity.value)) !== -1
    ) {
      SearchModule.removeSearchFilter({
        field: 'severity',
        previousValues: this.value,
        value: valueToSeverity(severity.value),
      });
    } else {
      SearchModule.addSearchFilter({
        field: 'severity',
        previousValues: this.value,
        value: valueToSeverity(severity.value),
      });
    }
  }
}
</script>
