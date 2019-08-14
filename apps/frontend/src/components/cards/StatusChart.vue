<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    v-on:category-selected="onSelect"
  />
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ApexPieChart, { Category } from "@/components/generic/ApexPieChart.vue";
import { getModule } from "vuex-module-decorators";
import StatusCountModule from "../../store/status_counts";
import { ControlStatus } from "inspecjs";
import colors from "vuetify/es5/util/colors";

// We declare the props separately to make props types inferable.
const StatusChartProps = Vue.extend({
  props: {
    filter: Object // Of type Filer from filteredData
  }
});

/**
 * Categories property must be of type Category
 * Emits "filter-status" with payload of type ControlStatus
 */
@Component({
  components: {
    ApexPieChart
  }
})
export default class StatusChart extends StatusChartProps {
  categories: Category<ControlStatus>[] = [
    {
      label: "Passed",
      value: "Passed",
      icon: "CheckCircleIcon",
      color: "statusPassed"
    },
    {
      label: "Failed",
      value: "Failed",
      icon: "XCircleIcon",
      color: "statusFailed"
    },
    {
      label: "Not Applicable",
      value: "Not Applicable",
      icon: "SlashIcon",
      color: "statusNotApplicable"
    },
    {
      label: "Not Reviewed",
      value: "Not Reviewed",
      icon: "AlertTriangleIcon",
      color: "statusNotReviewed"
    },
    {
      label: "Profile Error",
      value: "Profile Error",
      icon: "AlertCircleIcon",
      color: "statusProfileError"
    }
  ];

  get series(): number[] {
    let counts: StatusCountModule = getModule(StatusCountModule, this.$store);
    return [
      counts.passed(this.filter),
      counts.failed(this.filter),
      counts.notApplicable(this.filter),
      counts.notReviewed(this.filter),
      counts.profileError(this.filter)
    ];
  }

  onSelect(impact: Category<ControlStatus>) {
    this.$emit("filter-status", impact.value);
  }
}
</script>
