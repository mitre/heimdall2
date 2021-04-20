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
    <v-col
      v-if="profileErrorProps.number && currentStatusFilter !== 'Waived'"
      cols="12"
    >
      <v-card
        :color="profileErrorProps.color"
        class="d-flex flex-no-wrap justify-space-between"
        elevation="12"
      >
        <div>
          <v-card-title>
            <v-icon class="pr-3" large>mdi-{{ profileErrorProps.icon }}</v-icon>
            <span class="title">{{
              `ALERT: ${profileErrorProps.number} ${profileErrorProps.title}`
            }}</span>
          </v-card-title>
          <v-card-text v-text="profileErrorProps.subtitle" />
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
    <v-col
      v-if="waivedProfiles.number && currentStatusFilter !== 'Profile Error'"
      cols="12"
    >
      <v-card
        :color="waivedProfiles.color"
        class="d-flex flex-no-wrap justify-space-between"
        elevation="12"
      >
        <div>
          <v-card-title>
            <v-icon class="pr-3" large>mdi-{{ waivedProfiles.icon }}</v-icon>
            <span class="title">{{
              `INFO: ${waivedProfiles.number} ${waivedProfiles.title}`
            }}</span>
          </v-card-title>
          <v-card-text v-text="waivedProfiles.subtitle" />
        </div>
        <v-card-actions>
          <v-btn
            :disabled="filter.status === 'Waived'"
            @click="$emit('show-waived')"
            >Filter to Waived</v-btn
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
  @Prop({type: String, required: false}) readonly currentStatusFilter!: Filter;

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

  get profileErrorProps(): CardProps | null {
    // Want to ignore existing status filter
    const filter = {
      ...this.filter,
      status: undefined
    };
    return {
      icon: 'alert',
      title: 'Profile Errors',
      subtitle: `Errors running test - check profile run privileges or check with the author of profile.`,
      color: 'statusProfileError',
      number: StatusCountModule.countOf(filter, 'Profile Error')
    };
  }

  get waivedProfiles(): CardProps | null {
    return {
      icon: 'alert-circle',
      title: 'Waived Tests',
      subtitle: `Consider using an overlay or manual attestation to properly address this control.`,
      color: 'statusNotApplicable',
      number: StatusCountModule.countOf(this.filter, 'Waived')
    };
  }
}
</script>
