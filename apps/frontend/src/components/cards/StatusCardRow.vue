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
          <v-icon
            large
            left
          >
            mdi-{{ card.icon }}
          </v-icon>
          <span
            class="title"
            data-cy="cardText"
          >{{
            card.title + ': ' + card.number
          }}</span>
        </v-card-title>
        <v-card-text>{{ card.subtitle }}</v-card-text>
      </v-card>
    </v-col>
    <v-col
      v-if="
        profileErrorProps.number && !currentStatusFilter.includes('Waived')
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
            <v-icon
              class="pr-3"
              large
            >
              mdi-{{ profileErrorProps.icon }}
            </v-icon>
            <span class="title">{{
              `ALERT: ${profileErrorProps.number} ${profileErrorProps.title}s`
            }}</span>
          </v-card-title>
          <v-card-text>{{ profileErrorProps.subtitle }}</v-card-text>
        </div>
        <v-card-actions>
          <v-btn
            :disabled="filter.status.includes('Profile Error')"
            @click="$emit('show-errors')"
          >
            Filter to Errors
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col
      v-if="
        waivedProfiles.number &&
          !currentStatusFilter.includes('Profile Error')
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
            <v-icon
              class="pr-3"
              large
            >
              mdi-{{ waivedProfiles.icon }}
            </v-icon>
            <span class="title">{{
              `INFO: ${waivedProfiles.number} ${waivedProfiles.title} Tests`
            }}</span>
          </v-card-title>
          <v-card-text>{{ waivedProfiles.subtitle }}</v-card-text>
        </div>
        <v-card-actions>
          <v-btn
            :disabled="filter.status.includes('Waived')"
            @click="$emit('show-waived')"
          >
            Filter to Waived
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import type { ExtendedControlStatus, Filter } from '@/store/data_filters';
import { StatusCountModule } from '@/store/status_counts';

type CardProps = {
  color: string;
  icon: string;
  number: number;
  subtitle: string;
  title: ExtendedControlStatus;
};

@Component
export default class StatusCardRow extends Vue {
  @Prop({ required: false, type: Array }) readonly currentStatusFilter!: Filter;
  @Prop({ required: true, type: Object }) readonly filter!: Filter;

  get overlayRemovedFilter(): Filter {
    return {
      fromFile: this.filter.fromFile,
      omit_overlayed_controls: this.filter.omit_overlayed_controls,
    };
  }

  get profileErrorProps(): CardProps | null {
    // Want to ignore existing status filter
    const filter = {
      ...this.filter,
      status: [],
    };
    return {
      color: 'statusProfileError',
      icon: 'alert',
      number: StatusCountModule.countOf(filter, 'Profile Error'),
      subtitle: 'Errors running test - check profile run privileges or check with the author of profile.',
      title: 'Profile Error',
    };
  }

  // Cards
  get standardCardProps(): CardProps[] {
    return [
      {
        color: 'statusPassed',
        icon: 'check-circle',
        number: StatusCountModule.countOf(this.overlayRemovedFilter, 'Passed'),
        subtitle: `${StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'PassedTests',
        )} individual checks passed`,
        title: 'Passed',
      },
      {
        color: 'statusFailed',
        icon: 'close-circle',
        number: StatusCountModule.countOf(this.overlayRemovedFilter, 'Failed'),
        subtitle: `${StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'PassingTestsFailedControl',
        )} individual checks passed, ${StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'FailedTests',
        )} failed out of ${
          StatusCountModule.countOf(
            this.overlayRemovedFilter,
            'PassingTestsFailedControl',
          )
          + StatusCountModule.countOf(this.overlayRemovedFilter, 'FailedTests')
        } total checks`,
        title: 'Failed',
      },
      {
        color: 'statusNotApplicable',
        icon: 'minus-circle',
        number: StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'Not Applicable',
        ),
        subtitle: 'System exception or absent component',
        title: 'Not Applicable',
      },
      {
        color: 'statusNotReviewed',
        icon: 'alert-circle',
        number: StatusCountModule.countOf(
          this.overlayRemovedFilter,
          'Not Reviewed',
        ),
        subtitle: 'Can only be tested manually at this time',
        title: 'Not Reviewed',
      },
    ];
  }

  get waivedProfiles(): CardProps | null {
    return {
      color: 'statusNotApplicable',
      icon: 'alert-circle',
      number: StatusCountModule.countOf(
        { fromFile: this.filter.fromFile },
        'Waived',
      ),
      subtitle: 'Consider using an overlay or manual attestation to properly address this control.',
      title: 'Waived',
    };
  }

  getCardColor(card: CardProps): string {
    if (
      this.filter.status?.length === 0
      || this.filter.status?.some(
        statusFilter =>
          statusFilter.toLowerCase() === card.title.toLowerCase(),
      )
    ) {
      return card.color;
    }
    return '';
  }

  toggleFilter(filter: ExtendedControlStatus) {
    if (this.filter.status?.includes(filter)) {
      this.$emit('remove-filter', filter);
    } else {
      this.$emit('add-filter', filter);
    }
  }
}
</script>
