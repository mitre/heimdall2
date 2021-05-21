<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    :center-value="centerValue"
    @category-selected="onSelect"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import ApexPieChart, {Category} from '@/components/generic/ApexPieChart.vue';
import {StatusCountModule} from '@/store/status_counts';
import {ControlStatus} from 'inspecjs';
import {Prop} from 'vue-property-decorator';
import {ExtendedControlStatus, Filter} from '@/store/data_filters';

/**
 * Categories property must be of type Category
 * Model is of type ControlStatus | null - reflects selected severity
 */
@Component({
  components: {
    ApexPieChart
  }
})
export default class StatusChart extends Vue {
  @Prop({type: Array, default: null}) readonly value!: ExtendedControlStatus[] | null;
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  @Prop({type: Boolean, default: false}) show_compliance!: boolean;

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

  get centerValue(): string {
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
    if (this.value && this.value?.indexOf(status.value) !== -1) {
      this.$emit('input', []);
    } else {
      this.$emit('input', [status.value]);
    }
  }
}
</script>
