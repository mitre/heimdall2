<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    :center_label="center_label"
    :center_value="center_value"
    @category-selected="onSelect"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import ApexPieChart, {Category} from '@/components/generic/ApexPieChart.vue';
import {getModule} from 'vuex-module-decorators';
import StatusCountModule from '@/store/status_counts';
import {ControlStatus} from 'inspecjs';

// We declare the props separately to make props types inferable.
const StatusChartProps = Vue.extend({
  props: {
    value: String, // The currently selected status, or null
    filter: Object, // Of type Filer from filteredData
    show_compliance: Boolean
    //supress: Boolean // Supress status selection
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
      let counts = getModule(StatusCountModule, this.$store);
      let passed = counts.countOf(this.filter, 'Passed');
      let total =
        passed +
        counts.countOf(this.filter, 'Failed') +
        counts.countOf(this.filter, 'Profile Error') +
        counts.countOf(this.filter, 'Not Reviewed');
      if (total == 0) {
        return '0%';
      } else {
        return '' + Math.round((100.0 * passed) / total) + '%';
      }
    } else return '';
  }

  get series(): number[] {
    let counts: StatusCountModule = getModule(StatusCountModule, this.$store);
    return [
      counts.countOf(this.filter, 'Passed'),
      counts.countOf(this.filter, 'Failed'),
      counts.countOf(this.filter, 'Not Applicable'),
      counts.countOf(this.filter, 'Not Reviewed'),
      counts.countOf(this.filter, 'Profile Error')
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
