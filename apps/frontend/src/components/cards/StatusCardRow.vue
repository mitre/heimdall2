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
          <span class="title">{{ card.title + ': ' + card.number }}</span>
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
            <span class="title">{{
              `ALERT: ${errorProps.number} ${errorProps.title}`
            }}</span>
          </v-card-title>
          <v-card-text v-text="errorProps.subtitle" />
        </div>
        <v-card-actions>
          <v-btn
            @click="$emit('show-errors')"
            :disabled="filter.status === 'Profile Error'"
            >Filter to Errors</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {getModule} from 'vuex-module-decorators';
import StatusCountModule from '@/store/status_counts';
import {Filter} from '../../store/data_filters';

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
        icon: 'check-circle',
        title: 'Passed',
        subtitle: `Has ${counts.countOf(
          this.filter,
          'PassedTests'
        )} tests passed out of ${counts.countOf(this.filter, 'TotalTests')}`,
        color: 'statusPassed',
        number: counts.countOf(this.filter, 'Passed')
      },
      {
        icon: 'close-circle',
        title: 'Failed',
        subtitle: `Has ${counts.countOf(
          this.filter,
          'FailedTests'
        )} of ${counts.countOf(this.filter, 'TotalTests')} tests that failed`,
        color: 'statusFailed',
        number: counts.countOf(this.filter, 'Failed')
      },
      {
        icon: 'minus-circle',
        title: 'Not Applicable',
        subtitle: `System exception or absent component (${counts.countOf(
          this.filter,
          'NotApplicableTests'
        )} tests)`,
        color: 'statusNotApplicable',
        number: counts.countOf(this.filter, 'Not Applicable')
      },
      {
        icon: 'alert-circle',
        title: 'Not Reviewed',
        subtitle: `Can only be tested manually at this time (${counts.countOf(
          this.filter,
          'NotReviewedTests'
        )} tests)`,
        color: 'statusNotReviewed',
        number: counts.countOf(this.filter, 'Not Reviewed')
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
      icon: 'alert-circle',
      title: 'Profile Errors',
      subtitle: `Errors running test - check profile run privileges or check with the author of profile (${counts.countOf(
        filter,
        'ErroredTests'
      )} tests)`,
      color: 'statusProfileError',
      number: counts.countOf(this.filter, 'Profile Error')
    };
  }
}
</script>
