<template>
  <v-menu offset-y offset-overflow :close-on-content-click="false">
    <template #activator="{on}">
      <v-btn fab small class="ma-3" v-on="on">
        <v-icon> mdi-cog-outline </v-icon>
      </v-btn>
    </template>
    <v-card max-width="400" class="px-5">
      <v-card-title class="py-5">Column Select</v-card-title>
      <v-chip-group
        v-model="currentHeaders"
        active-class="primary--text"
        center-active
        column
        multiple
      >
        <v-chip
          v-for="field in headerOptions"
          :key="field.key"
          :value="field.key"
        >
          {{ field.name }}
        </v-chip>
      </v-chip-group>
      <v-divider />
      <v-card-title class="py-2">Severity Filters</v-card-title>
      <v-chip-group
        v-model="value.severities"
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
    </v-card>
  </v-menu>
</template>
<script lang="ts">
import {SbomViewSettings} from '@/utilities/sbom_util';
import {severities, Severity} from 'inspecjs';
import _ from 'lodash';
import Component from 'vue-class-component';
import {Prop, Vue} from 'vue-property-decorator';

@Component({
  components: {}
})
export default class SbomSettingsSelector extends Vue {
  @Prop({type: Object, required: true}) readonly value!: SbomViewSettings;

  /**
   * A list of options (selectable in the column select menu) for which
   * headers to display
   */
  headerOptions = [
    'name',
    'version',
    'description',
    'author',
    'group',
    'publisher',
    'type',
    'bom-ref',
    'purl',
    'cpe',
    'copyright',
    'scope',
    'mime-type',
    'affectingVulnerabilities'
  ].map((option) => ({name: _.startCase(option), key: option}));

  headerIndex(str: string) {
    return this.headerOptions.findIndex((option) => option.key === str);
  }

  set currentHeaders(value: string[]) {
    this.value.currentHeaders = _.sortBy(value, this.headerIndex);
  }

  get currentHeaders() {
    return this.value.currentHeaders;
  }

  severityName(severity: string): string {
    return _.startCase(severity);
  }

  get severities(): Severity[] {
    // returns the list of severities defined by inspecJS
    return [...severities];
  }
}
</script>
