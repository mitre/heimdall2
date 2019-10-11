<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="3"
      v-for="card in standardCardProps"
      :key="card.title"
    >
      <v-card height="100%" :color="card.color">
        <v-card-title>
          <v-icon large left>mdi-{{ card.icon }}</v-icon>
          <span class="title">{{ card.title + ": " + card.number }}</span>
        </v-card-title>
        <v-card-text v-text="card.subtitle" />
      </v-card>
    </v-col>
    <v-col cols="12" v-if="errorProps.number">
      <v-card
        color="statusProfileError"
        class="d-flex flex-no-wrap justify-space-between"
        elevation="12"
      >
        <div>
          <v-card-title>
            <v-icon class="pr-3" large>mdi-{{ errorProps.icon }}</v-icon>
            <span class="title">
              {{ `ALERT: ${errorProps.number} ${errorProps.title}` }}
            </span>
          </v-card-title>
          <v-card-text v-text="errorProps.subtitle" />
        </div>
        <v-card-actions>
          <v-btn
            @click="$emit('show-errors')"
            :disabled="filter.status === 'Profile Error'"
          >
            Filter to Errors
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import StatusCountModule from "@/store/status_counts";
import { Filter } from "../../store/data_filters";

interface CardProps {
  icon: string;
  title: string;
  number: number;
  subtitle: string;
  color: string;
}

// We declare the props separately to make props types inferable.
const StatusCardRowProps = Vue.extend({
  props: {
    filter: Object // Of type Filter
  }
});

@Component({
  components: {}
})
export default class StatusCardRow extends StatusCardRowProps {
  // Cards
  get standardCardProps(): CardProps[] {
    let counts = getModule(StatusCountModule, this.$store);
    let filter = this.filter as Filter;
    return [
      {
        icon: "check-circle",
        title: "Passed",
        subtitle: "All tests passed.",
        color: "statusPassed",
        number: counts.passed(filter)
      },
      {
        icon: "close-circle",
        title: "Failed",
        subtitle: "Has tests that failed.",
        color: "statusFailed",
        number: counts.failed(filter)
      },
      {
        icon: "minus-circle",
        title: "Not Applicable",
        subtitle: "System exception/absent component.",
        color: "statusNotApplicable",
        number: counts.notApplicable(filter)
      },
      {
        icon: "alert-circle",
        title: "Not Reviewed",
        subtitle: "Manual testing required/disabled test.",
        color: "statusNotReviewed",
        number: counts.notReviewed(filter)
      }
    ];
  }

  get errorProps(): CardProps | null {
    let counts = getModule(StatusCountModule, this.$store);
    let filter = this.filter as Filter;
    // Want to ignore existing status filter
    filter = {
      ...filter,
      status: undefined
    };
    return {
      icon: "alert-circle",
      title: "Profile Errors",
      subtitle:
        "Errors running test - check profile run privileges or check with the author of profile",
      color: "statusProfileError",
      number: counts.profileError(filter)
    };
  }
}
</script>
