<template>
  <v-row>
    <v-col
      v-for="card in standardCardProps"
      :key="card.title"
      cols="12"
      sm="6"
      md="3"
    >
      <v-card
        height="100%"
        :color="getCardColor(card)"
        @click="toggleFilter(card.title)"
      >
        <v-card-title>
          <v-icon large left>mdi-{{ card.icon }}</v-icon>
          <span class="title" data-cy="cardText">{{
            card.title + ': ' + card.number
          }}</span>
        </v-card-title>
        <v-card-text>{{ card.subtitle }}</v-card-text>
      </v-card>
    </v-col>
    <v-col
      v-if="
        profileErrorProps.number && currentStatusFilter.indexOf('Waived') == -1
      "
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
              `ALERT: ${profileErrorProps.number} ${profileErrorProps.title}s`
            }}</span>
          </v-card-title>
          <v-card-text>{{ profileErrorProps.subtitle }}</v-card-text>
        </div>
        <v-card-actions>
          <v-btn
            :disabled="filter.status.indexOf('Profile Error') !== -1"
            @click="$emit('show-errors')"
            >Filter to Errors</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col
      v-if="
        waivedProfiles.number &&
        currentStatusFilter.indexOf('Profile Error') == -1
      "
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
              `INFO: ${waivedProfiles.number} ${waivedProfiles.title} Tests`
            }}</span>
          </v-card-title>
          <v-card-text>{{ waivedProfiles.subtitle }}</v-card-text>
        </div>
        <v-card-actions>
          <v-btn
            :disabled="filter.status.indexOf('Waived') !== -1"
            @click="$emit('show-waived')"
            >Filter to Waived</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {ExtendedControlStatus, ControlsFilter} from '@/store/data_filters';
import {StatusCountModule} from '@/store/status_counts';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

interface CardProps {
  icon: string;
  title: ExtendedControlStatus;
  number: number;
  subtitle: string;
  color: string;
}

@Component
export default class StatusCardRow extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: ControlsFilter;
  @Prop({type: Array, required: false})
  readonly currentStatusFilter!: ControlsFilter;

  get overlayRemovedFilter(): ControlsFilter {
    return {
      fromFile: this.filter.fromFile,
      omit_overlayed_controls: this.filter.omit_overlayed_controls
    };
  }

  // Cards
  get standardCardProps(): CardProps[] {
    return [
      {
        icon: 'check-circle',
        title: 'Passed',
        subtitle: `${StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'PassedTests'
        )} individual checks passed`,
        color: 'statusPassed',
        number: StatusCountModule.countOf(this.overlayRemovedFilter, 'Passed')
      },
      {
        icon: 'close-circle',
        title: 'Failed',
        subtitle: `${StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'PassingTestsFailedControl'
        )} individual checks passed, ${StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'FailedTests'
        )} failed out of ${
          StatusCountModule.countOf(
            this.overlayRemovedFilter,
            'PassingTestsFailedControl'
          ) +
          StatusCountModule.countOf(this.overlayRemovedFilter, 'FailedTests')
        } total checks`,
        color: 'statusFailed',
        number: StatusCountModule.countOf(this.overlayRemovedFilter, 'Failed')
      },
      {
        icon: 'minus-circle',
        title: 'Not Applicable',
        subtitle: `System exception or absent component`,
        color: 'statusNotApplicable',
        number: StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'Not Applicable'
        )
      },
      {
        icon: 'alert-circle',
        title: 'Not Reviewed',
        subtitle: `Can only be tested manually at this time`,
        color: 'statusNotReviewed',
        number: StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'Not Reviewed'
        )
      }
    ];
  }

  get profileErrorProps(): CardProps | null {
    // Want to ignore existing status filter
    const filter = {
      ...this.filter,
      status: []
    };
    return {
      icon: 'alert',
      title: 'Profile Error',
      subtitle: `Errors running test - check profile run privileges or check with the author of profile.`,
      color: 'statusProfileError',
      number: StatusCountModule.countOf(filter, 'Profile Error')
    };
  }

  get waivedProfiles(): CardProps | null {
    return {
      icon: 'alert-circle',
      title: 'Waived',
      subtitle: `Consider using an overlay or manual attestation to properly address this control.`,
      color: 'statusNotApplicable',
      number: StatusCountModule.countOf(
        {fromFile: this.filter.fromFile},
        'Waived'
      )
    };
  }

  getCardColor(card: CardProps): string {
    if (
      this.filter.status?.length === 0 ||
      this.filter.status?.some(
        (statusFilter) =>
          statusFilter.value.toLowerCase() === card.title.toLowerCase()
      )
    ) {
      return card.color;
    }
    return '';
  }

  toggleFilter(filter: ExtendedControlStatus) {
    if (
      this.filter.status?.find((obj) => {
        return obj.value === filter.toLowerCase();
      }) !== undefined
    ) {
      this.$emit('remove-filter', filter.toLowerCase());
    } else {
      this.$emit('add-filter', filter.toLowerCase());
    }
  }
}
</script>
