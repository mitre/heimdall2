<template>
  <v-row>
    <v-col
      v-if="severityOverrideProps.number"
      cols="12"
    >
      <v-card
        :color="severityOverrideProps.color"
        class="d-flex flex-no-wrap justify-space-between"
        elevation="12"
      >
        <div>
          <v-card-title>
            <v-icon
              class="pr-3"
              large
            >
              mdi-{{ severityOverrideProps.icon }}
            </v-icon>
            <span class="title">{{
              `${severityOverrideProps.title}: ${severityOverrideProps.number}`
            }}</span>
          </v-card-title>
          <v-card-text>{{ severityOverrideProps.subtitle }}</v-card-text>
        </div>
        <v-card-actions>
          <v-btn
            :disabled="
              filter.tagFilter &&
                filter.tagFilter.includes('severityoverride')
            "
            @click="$emit('show-severity-overrides')"
          >
            Filter to Severity Overrides
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
import type { Filter } from '@/store/data_filters';
import { FilteredDataModule } from '@/store/data_filters';

type CardProps = {
  color: string;
  icon: string;
  number: number;
  subtitle: string;
  title: string;
};

@Component
export default class InfoCardRow extends Vue {
  @Prop({ required: true, type: Object }) readonly filter!: Filter;

  get severityOverrideProps(): CardProps {
    const filter = {
      ...this.filter,
      tagFilter: ['severityoverride'],
    };
    return {
      color: 'cyan',
      icon: 'delta',
      number: FilteredDataModule.controls(filter).length,
      subtitle: 'Some controls have overridden severities',
      title: 'Severity Overrides',
    };
  }
}
</script>
