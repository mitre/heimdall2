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
        v-model="headers"
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
    </v-card>
  </v-menu>
</template>
<script lang="ts">
import {SbomViewSettings} from '@/utilities/sbom_util';
import _ from 'lodash';
import Component from 'vue-class-component';
import {Prop, Vue} from 'vue-property-decorator';

@Component({
  components: {}
})
export default class SbomSettingsSelector extends Vue {
  @Prop({type: Object, required: true}) value!: SbomViewSettings;

  /**
   * A list of options (selectable in the column select menu) for which
   * headers to display
   */
  headerOptions = [
    'fileName',
    'name',
    'version',
    'author',
    'group',
    'description',
    'publisher',
    'type',
    'bom-ref',
    'purl',
    'cpe',
    'copyright',
    'scope',
    'mime-type',
    'children.length',
    'parents.length',
    'affectingVulnerabilities',
    'treeView'
  ].map((option) => ({name: _.startCase(option), key: option}));

  headerIndex(str: string) {
    return this.headerOptions.findIndex((option) => option.key === str);
  }

  set headers(value: string[]) {
    this.value.currentHeaders = _.sortBy(value, this.headerIndex);
  }

  get headers() {
    return this.value.currentHeaders;
  }
}
</script>
