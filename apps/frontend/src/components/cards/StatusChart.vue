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
import {StatusCountModule} from '@/store/status_counts';
import {ControlStatus} from 'inspecjs';

// We declare the props separately to make props types inferable.
const StatusChartProps = Vue.extend({
  props: {
    value: String, // The currently selected status, or null
    filter: Object, // Of type Filer from filteredData
    show_compliance: Boolean
  }
});

/**
 * Categories property must be of type Category
 * Model is of type ControlStatus | null - reflects selected severity
 */
@Component({
  components: {
    ApexPieChart
  }
})
export default class StatusChart extends StatusChartProps {
  categories: Category<ControlStatus>[] = [
    {
      label: 'Passed',
      value: 'Passed',
      color: 'statusPassed'
    },
    {
      label: 'Failed',
      value: 'Failed',
      color: 'statusFailed'
    },
    {
      label: 'Not Applicable',
      value: 'Not Applicable',
      color: 'statusNotApplicable'
    },
    {
      label: 'Not Reviewed',
      value: 'Not Reviewed',
      color: 'statusNotReviewed'
    },
    {
      label: 'Profile Error',
      value: 'Profile Error',
      color: 'statusProfileError'
    }
  ];

  get center_label(): string {
    if (this.show_compliance) {
      return 'Compliance:';
    }
    return '';
  }

  get center_value(): string {
    if (this.show_compliance) {
      let passed = StatusCountModule.countOf(this.filter, 'Passed');
      let total =
        passed +
        StatusCountModule.countOf(this.filter, 'Failed') +
        StatusCountModule.countOf(this.filter, 'Profile Error') +
        StatusCountModule.countOf(this.filter, 'Not Reviewed');
      if (total == 0) {
        return '0%';
      } else {
        return '' + Math.round((100.0 * passed) / total) + '%';
      }
    } else return '';
  }

  get series(): number[] {
    return [
      StatusCountModule.countOf(this.filter, 'Passed'),
      StatusCountModule.countOf(this.filter, 'Failed'),
      StatusCountModule.countOf(this.filter, 'Not Applicable'),
      StatusCountModule.countOf(this.filter, 'Not Reviewed'),
      StatusCountModule.countOf(this.filter, 'Profile Error')
    ];
  }

  onSelect(status: Category<ControlStatus>) {
    // In the case that the values are the same, we want to instead emit null
    if (status.value === this.value) {
      this.$emit('input', null);
    } else {
      this.$emit('input', status.value);
    }
  }
}
</script>
