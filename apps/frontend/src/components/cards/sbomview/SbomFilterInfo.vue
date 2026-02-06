<template>
  <v-menu offset-y offset-overflow :close-on-content-click="false">
    <template #activator="{on}">
      <v-btn fab small class="ma-3" v-on="on">
        <v-icon> mdi-filter-outline </v-icon>
      </v-btn>
    </template>
    <v-card max-width="400" class="px-5">
      <v-card-title class="py-2">Severity Filters</v-card-title>
      <v-chip-group
        v-model="value.severity"
        active-class="primary--text"
        center-active
        column
        multiple
      >
        <v-chip
          v-for="severity in severities"
          :key="severity"
          :value="severity"
        >
          {{ severityName(severity) }}
        </v-chip>
      </v-chip-group>
      <v-divider />
      <v-card-title> Target BOM Refs </v-card-title>
      <v-list-item v-for="ref in value['bom-refs']" :key="ref">
        {{ ref }}
      </v-list-item>
    </v-card>
  </v-menu>
</template>
<script lang="ts">
import {SBOMFilter} from '@/store/data_filters';
import {severities, Severity} from 'inspecjs';
import _ from 'lodash';
import Component from 'vue-class-component';
import {Prop, Vue} from 'vue-property-decorator';

@Component({
  components: {}
})
export default class SbomFilterInfo extends Vue {
  @Prop({type: Object, required: true}) value!: SBOMFilter;

  severityName(severity: string): string {
    return _.startCase(severity);
  }

  get severities(): Severity[] {
    // returns the list of severities defined by inspecJS
    return [...severities];
  }
}
</script>
