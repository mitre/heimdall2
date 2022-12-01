<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    :center-value="centerValue"
    @category-selected="onSelect"
  />
</template>

<script lang="ts">
import ApexPieChart, {Category} from '@/components/generic/ApexPieChart.vue';
import {ExtendedControlStatus, Filter} from '@/store/data_filters';
import {calculateCompliance, StatusCountModule} from '@/store/status_counts';
import {ControlStatus} from 'inspecjs';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {SearchModule} from '../../store/search';
import {formatCompliance} from '@mitre/hdf-converters';

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
  @Prop({type: Array, default: null}) readonly value!:
    | ExtendedControlStatus[]
    | null;

  @Prop({type: Object, required: true}) readonly filter!: Filter;
  @Prop({type: Boolean, default: false}) showCompliance!: boolean;

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
    if (this.showCompliance) {
      return formatCompliance(calculateCompliance(this.filter));
    } else {
      return '';
    }
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
    if (SearchModule.statusFilter?.indexOf(status.value) !== -1) {
      SearchModule.removeSearchFilter({
        field: 'status',
        value: status.value
      });
    } else {
      SearchModule.addSearchFilter({
        field: 'status',
        value: status.value
      });
    }
  }
}
</script>
