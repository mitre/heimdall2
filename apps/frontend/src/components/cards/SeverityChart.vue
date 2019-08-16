<template>
  <ApexPieChart
    :categories="categories"
    :series="series"
    @category-selected="onSelect"
  />
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ApexPieChart, { Category } from "@/components/generic/ApexPieChart.vue";
import { getModule } from "vuex-module-decorators";
import SeverityCountModule from "../../store/severity_counts";
import { Severity } from "inspecjs";

// We declare the props separately to make props types inferable.
const SeverityChartProps = Vue.extend({
  props: {
    value: String, // The currently selected severity, or null
    filter: Object // Of type Filer from filteredData
  }
});

/**
 * Categories property must be of type Category
 * Model is of type Severity | null - reflects selected severity
 */
@Component({
  components: {
    ApexPieChart
  }
})
export default class SeverityChart extends SeverityChartProps {
  categories: Category<Severity>[] = [
    // { label: "Low", value: "low", icon: "SquareIcon", color: "var(--v-success-base)" },
    { label: "Low", value: "low", color: "severityLow" },
    {
      label: "Medium",
      value: "medium",
      color: "severityMedium"
    },
    {
      label: "High",
      value: "high",
      color: "severityHigh"
    },
    {
      label: "Critical",
      value: "critical",
      color: "severityCritical"
    }
  ];

  get series(): number[] {
    let counts: SeverityCountModule = getModule(
      SeverityCountModule,
      this.$store
    );
    return [
      counts.low(this.filter),
      counts.medium(this.filter),
      counts.high(this.filter),
      counts.critical(this.filter)
    ];
  }

  onSelect(severity: Category<Severity>) {
    // In the case that the values are the same, we want to instead emit null
    if (severity.value === this.value) {
      this.$emit("input", null);
    } else {
      this.$emit("input", severity.value);
    }
  }
}
</script>
