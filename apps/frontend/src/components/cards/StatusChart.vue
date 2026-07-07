<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    :center-value="centerValue"
    @category-selected="onSelect"
  />
</template>

<script lang="ts">
import { formatCompliance } from '@mitre/hdf-converters';
import { ControlStatus } from 'inspecjs';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ApexPieChart, { Category } from '@/components/generic/ApexPieChart.vue';
import type { ExtendedControlStatus, Filter } from '@/store/data_filters';
import { calculateCompliance, StatusCountModule } from '@/store/status_counts';
import { SearchModule } from '../../store/search';

/**
 * Categories property must be of type Category
 * Model is of type ControlStatus | null - reflects selected severity
 */
@Component({ components: { ApexPieChart } })
export default class StatusChart extends Vue {
  categories: Category<ControlStatus>[] = [
    {
      color: 'statusPassed',
      label: 'Passed',
      value: 'Passed',
    },
    {
      color: 'statusFailed',
      label: 'Failed',
      value: 'Failed',
    },
    {
      color: 'statusNotApplicable',
      label: 'Not Applicable',
      value: 'Not Applicable',
    },
    {
      color: 'statusNotReviewed',
      label: 'Not Reviewed',
      value: 'Not Reviewed',
    },
    {
      color: 'statusProfileError',
      label: 'Profile Error',
      value: 'Profile Error',
    },
  ];

  @Prop({ required: true, type: Object }) readonly filter!: Filter;
  @Prop({ default: false, type: Boolean }) showCompliance!: boolean;

  @Prop({ default: null, type: Array }) readonly value!:
    | ExtendedControlStatus[]
    | null;

  get centerValue(): string {
    return this.showCompliance ? formatCompliance(calculateCompliance(this.filter)) : '';
  }

  get series(): number[] {
    return [
      StatusCountModule.countOf(this.filter, 'Passed'),
      StatusCountModule.countOf(this.filter, 'Failed'),
      StatusCountModule.countOf(this.filter, 'Not Applicable'),
      StatusCountModule.countOf(this.filter, 'Not Reviewed'),
      StatusCountModule.countOf(this.filter, 'Profile Error'),
    ];
  }

  onSelect(status: Category<ControlStatus>) {
    if (SearchModule.statusFilter?.indexOf(status.value) === -1) {
      SearchModule.addSearchFilter({
        field: 'status',
        previousValues: this.value || [],
        value: status.value,
      });
    } else {
      SearchModule.removeSearchFilter({
        field: 'status',
        previousValues: this.value || [],
        value: status.value,
      });
    }
  }
}
</script>
