<template>
  <v-row>
    <v-col
      v-for="card in standardCardProps"
      :key="card.title"
      cols="12"
      sm="6"
      md="3"
    >
      <v-card height="100%" :color="card.color">
        <v-card-title>
          <v-icon large left>mdi-{{ card.icon }}</v-icon>
          <span class="title" data-cy="cardText">{{
            card.title + ': ' + card.number
          }}</span>
        </v-card-title>
        <v-card-text v-text="card.subtitle" />
      </v-card>
    </v-col>
    <v-col v-if="errorProps.number" cols="12">
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
            :disabled="filter.status === 'Profile Error'"
            @click="$emit('show-errors')"
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
import {StatusCountModule} from '@/store/status_counts';
import {Filter} from '@/store/data_filters';
import {Prop} from 'vue-property-decorator';

interface CardProps {
  icon: string;
  title: string;
  number: number;
  subtitle: string;
  color: string;
}

@Component
export default class StatusCardRow extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  // Cards
  get standardCardProps(): CardProps[] {
    return [
      {
        icon: 'check-circle',
        title: 'Passed',
        subtitle: `${StatusCountModule.countOf(
          this.filter,
          'PassedTests'
        )} individual checks passed`,
        color: 'statusPassed',
        number: StatusCountModule.countOf(this.filter, 'Passed')
      },
      {
        icon: 'close-circle',
        title: 'Failed',
        subtitle: `${StatusCountModule.countOf(
          this.filter,
          'PassingTestsFailedControl'
        )} individual checks passed, ${StatusCountModule.countOf(
          this.filter,
          'FailedTests'
        )} failed out of ${StatusCountModule.countOf(
          this.filter,
          'PassingTestsFailedControl'
        ) + StatusCountModule.countOf(
          this.filter,
          'FailedTests'
        )} total checks`,
        color: 'statusFailed',
        number: StatusCountModule.countOf(this.filter, 'Failed')
      },
      {
        icon: 'minus-circle',
        title: 'Not Applicable',
        subtitle: `System exception or absent component`,
        color: 'statusNotApplicable',
        number: StatusCountModule.countOf(this.filter, 'Not Applicable')
      },
      {
        icon: 'alert-circle',
        title: 'Not Reviewed',
        subtitle: `Can only be tested manually at this time`,
        color: 'statusNotReviewed',
        number: StatusCountModule.countOf(this.filter, 'Not Reviewed')
      }
    ];
  }

  get errorProps(): CardProps | null {
    // Want to ignore existing status filter
    let filter = {
      ...this.filter,
      status: undefined
    };
    return {
      icon: 'alert-circle',
      title: 'Profile Errors',
      subtitle: `Errors running test - check profile run privileges or check with the author of profile`,
      color: 'statusProfileError',
      number: StatusCountModule.countOf(filter, 'Profile Error')
    };
  }
}
</script>
