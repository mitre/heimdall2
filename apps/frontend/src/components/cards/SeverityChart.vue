<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    @category-selected="onSelect"
  />
</template>

<script lang="ts">
import ApexPieChart, {Category} from '@/components/generic/ApexPieChart.vue';
import {Filter} from '@/store/data_filters';
import {SeverityCountModule} from '@/store/severity_counts';
import {Severity} from 'inspecjs';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {SearchModule, valueToSeverity} from '../../store/search';

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
    {label: 'None', value: 'none', color: 'severityNone'},
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
      SeverityCountModule.none(this.filter),
      SeverityCountModule.low(this.filter),
      SeverityCountModule.medium(this.filter),
      SeverityCountModule.high(this.filter),
      SeverityCountModule.critical(this.filter)
    ];
  }

  onSelect(severity: Category<Severity>) {
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
