<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    @category-selected="onSelect"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import ApexPieChart, {Category} from '@/components/generic/ApexPieChart.vue';
import {Severity} from 'inspecjs';
import {SeverityCountModule} from '@/store/severity_counts';
import {Filter} from '@/store/data_filters';
import {Prop} from 'vue-property-decorator';
import {SearchModule} from '../../store/search';

/**
 * Categories property must be of type Category
 * Model is of type Severity | null - reflects selected severity
 */
@Component({
  components: {
    ApexPieChart
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

  valueToSeverity(severity: string): Severity {
    switch (severity) {
      case 'low':
        return 'low'
      case 'medium':
        return 'medium'
      case 'high':
        return 'high'
      case 'critical':
        return 'critical'
    }
    return 'none'
  }

  onSelect(severity: Category<Severity>) {
    // In the case that the values are the same, we want to instead emit null
    if (this.value && this.value?.indexOf(this.valueToSeverity(severity.value)) !== -1) {
      SearchModule.removeSeveritySearch(this.valueToSeverity(severity.value));
    } else {
      SearchModule.addSeveritySearch(this.valueToSeverity(severity.value));
    }
  }
}
</script>
