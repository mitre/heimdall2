<template>
  <v-row>
    <v-col v-if="severityOverrideProps.number" cols="12">
      <v-card
        :color="severityOverrideProps.color"
        class="d-flex flex-no-wrap justify-space-between"
        elevation="12"
      >
        <div>
          <v-card-title>
            <v-icon class="pr-3" large
              >mdi-{{ severityOverrideProps.icon }}</v-icon
            >
            <span class="title">{{
              `${severityOverrideProps.title}: ${severityOverrideProps.number}`
            }}</span>
          </v-card-title>
          <v-card-text>{{ severityOverrideProps.subtitle }}</v-card-text>
        </div>
        <v-card-actions>
          <v-btn
            :disabled="filter.tagFilter?.indexOf('severityoverride') !== -1"
            @click="$emit('show-severity-overrides')"
            >Filter to Severity Overrides</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {Filter, FilteredDataModule} from '@/store/data_filters';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

interface CardProps {
  icon: string;
  title: string;
  number: number;
  subtitle: string;
  color: string;
}

@Component
export default class InfoCardRow extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  get severityOverrideProps(): CardProps {
    const filter = {
      ...this.filter,
      tagFilter: ['severityoverride']
    };
    return {
      icon: 'delta',
      title: 'Severity Overrides',
      subtitle: 'Some controls have overridden severities',
      color: 'cyan',
      number: FilteredDataModule.controls(filter).length
    };
  }
}
</script>
