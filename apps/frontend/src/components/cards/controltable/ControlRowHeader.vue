<template>
  <!-- Need to catch for ResponsiveRowSwitch @toggle events for small view -->
  <ResponsiveRowSwitch :dense="true">
    <template #status>
      <v-card
        :color="status_color"
        class="pl-2 font-weight-bold"
        hover
        @click="$emit('toggle', !controlExpanded)"
      >
        <v-card-text class="pa-2 font-weight-bold">
          {{ control.root.hdf.status }}
          <v-icon class="float-right">
            {{ controlExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </v-card-text>
      </v-card>
    </template>
    <template #set>
      <v-row class="pa-4">
        <div
          class="pa-2 title"
          :style="$vuetify.breakpoint.lgAndUp ? 'width: 15vw' : 'width:20vw'"
          v-text="filename"
        />
        <v-tooltip v-if="isOverlaid" bottom>
          <template #activator="{ on, attrs }">
            <v-icon
              style="cursor: pointer"
              class="ml-2"
              v-bind="attrs"
              v-on="on"
            >mdi-delta</v-icon>
          </template>
          <span>This control has been modified in an overlay</span>
        </v-tooltip>
      </v-row>
    </template>
    <template #severity>
      <v-card-text class="pa-2">
        <v-tooltip v-if="'severityoverride' in control.data.tags" bottom>
          <template #activator="{on}">
            <span v-on="on">
              <v-chip outlined :color="severity_color">
                <v-icon size="16" class="mr-1" data-cy="severityOverride">
                  mdi-delta
                </v-icon>
                {{ (control.hdf.severity || 'none').toUpperCase() }}
              </v-chip>
            </span>
          </template>
          <span>
            <span>
              Severity has been overridden from
              <span v-if="'severity' in control.data.tags">
                {{ control.data.tags['severity'] }}
              </span>
              <span v-else> Unknown </span>
              to {{ control.data.tags['severityoverride'] }}
              <br />
              <span v-if="'severityjustification' in control.data.tags">
                Justification: {{ control.data.tags['severityjustification'] }}
              </span>
              <span v-else> No justification provided </span>
            </span>
          </span>
        </v-tooltip>
        <v-chip v-else outlined :color="severity_color">
          {{ (control.hdf.severity || 'none').toUpperCase() }}
        </v-chip>
      </v-card-text>
    </template>
    <!-- eslint-disable vue/no-v-html -->
    <template #title>
      <div class="pa-2 title" v-html="sanitize_html(control.data.title)" />
    </template>
    <!-- eslint-enable vue/no-v-html -->
    <!-- ID and Tags -->
    <template #id>
      <v-card-text class="pa-2 title font-weight-bold">
        <div>
          {{ control.data.id }}
        </div>
        <div v-if="showLegacy(control)">
          {{ showLegacy(control) }}
        </div>
      </v-card-text>
    </template>
    <template #tags>
      <v-chip-group column>
        <v-tooltip v-for="(tag, i) in nistTags" :key="'nist-chip' + i" bottom>
          <template #activator="{ on }">
            <v-chip
              :href="tag.url"
              target="_blank"
              active-class="NONE"
              v-on="on"
            >
              {{ tag.label }}
            </v-chip>
          </template>
          <span>{{ tag.description }}</span>
        </v-tooltip>
      </v-chip-group>
      <v-chip-group column>
        <v-tooltip v-for="(tag, i) in cciTags" :key="'cci-chip' + i" bottom>
          <template #activator="{ on }">
            <v-chip style="cursor: help" active-class="NONE" v-on="on">
              {{ tag.label }}
            </v-chip>
          </template>
          <span>{{ tag.description }}</span>
        </v-tooltip>
      </v-chip-group>
      <v-chip-group column active-class="NONE">
        <v-tooltip v-for="(tag, i) in mappedTags" :key="'mapped-chip' + i" bottom>
          <template #activator="{ on }">
            <v-chip style="cursor: help" active-class="NONE" v-on="on">
              {{ tag.label }}
            </v-chip>
          </template>
          <span>{{ tag.description }}</span>
        </v-tooltip>
      </v-chip-group>
    </template>
    <!-- Control Run Time -->
    <template #runTime>
      <v-card-text class="pa-2 title font-weight-bold">{{
        runTime
      }}</v-card-text>
    </template>
    <template #viewed>
      <v-container class="py-0 my-0 fill-height">
        <v-layout
          class="py-0 my-0"
          :justify-center="$vuetify.breakpoint.lgAndUp"
          :align-center="$vuetify.breakpoint.lgAndUp"
        >
          <v-checkbox
            v-model="wasViewed"
            class="align-center justify-center py-0 my-0 pl-0"
            hide-details
            :label="$vuetify.breakpoint.lgAndUp ? '' : 'Viewed'"
          />
        </v-layout>
      </v-container>
    </template>
  </ResponsiveRowSwitch>
</template>
<script lang="ts">
import ResponsiveRowSwitch from '@/components/cards/controltable/ResponsiveRowSwitch.vue';
import HtmlSanitizeMixin from '@/mixins/HtmlSanitizeMixin';
import { CCI_DESCRIPTIONS } from '@/utilities/cci_util';
import { getControlRunTime } from '@/utilities/delta_util';
import { nistCanonConfig, NIST_DESCRIPTIONS } from '@/utilities/nist_util';
import { ContextualizedControl, is_control, parse_nist } from 'inspecjs';
import * as _ from 'lodash';
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
interface Tag {
  label: string;
  url: string;
  description: string;
}
@Component({
  components: {
    ResponsiveRowSwitch,
  },
  computed: {
    ...mapGetters('selectedTags', ['checkedValues']),
    ...mapGetters('mappings', ['mappings']),
    ...mapGetters('mappings', ['descriptions'])
  }
})export default class ControlRowHeader extends mixins(HtmlSanitizeMixin) {
  @Prop({ type: Object, required: true }) readonly control!: ContextualizedControl;
  @Prop({ type: Array, required: true }) readonly viewedControls!: string[];
  @Prop({ type: Boolean, default: false }) readonly controlExpanded!: boolean;
  @Prop({ type: Boolean, default: false }) readonly showImpact!: boolean;
  get runTime(): string {
    return `${_.truncate(getControlRunTime(this.control).toString(), {
      length: 5,
      omission: ''
    })}s`;
  }
  get filename(): string | undefined {
    return _.get(this.control, 'sourcedFrom.sourcedFrom.from_file.filename');
  }
  get truncated_title(): string {
    if (this.control.data.title && this.control.data.title.length > 80) {
      return this.control.data.title.substr(0, 80) + '...';
    } else {
      return this.control.data.title || 'Untitled';
    }
  }
  get status_color(): string {
    return `status${this.control.root.hdf.status.replace(' ', '')}`;
  }
  get severity_color(): string {
    return `severity${_.startCase(this.control.hdf.severity)}`;
  }
  get wasViewed(): boolean {
    return this.viewedControls.indexOf(this.control.data.id) !== -1;
  }
  set wasViewed(_value: boolean) {
    this.$emit('control-viewed', this.control);
  }
  get isOverlaid() {
    return this.control.extendsFrom.some(
      (extension) =>
        extension.data.code !== this.control.data.code &&
        extension.data.code !== ''
    );
  }
  severity_arrow_count(severity: string): number {
    switch (severity) {
      case 'low':
        return 1;
      case 'medium':
        return 2;
      case 'high':
        return 3;
      case 'critical':
        return 4;
      default:
        return 0;
    }
  }
  // Get NIST tag description for NIST tag, this is pulled from the 800-53 xml
  // and relies on a script not contained in the project
  descriptionForTag(tag: string): string {
    const nisted = parse_nist(tag);
    if (is_control(nisted)) {
      const canon = nisted.canonize(nistCanonConfig);
      const found = NIST_DESCRIPTIONS[canon];
      if (found) {
        return found;
      }
    } else if (CCI_DESCRIPTIONS[tag.toUpperCase()]) {
      return CCI_DESCRIPTIONS[tag.toUpperCase()].def;
    }
    return 'Unrecognized Tag';
  }
  get nistTags(): Tag[] {
    if (!this.checkedValues.includes('nist')) {
      return [];
    }
    let nistTags = this.control.hdf.rawNistTags;
    nistTags = nistTags.filter((tag) => tag.search(/Rev.*\d/i) === -1);
    return nistTags.map((tag) => {
      const nisted = parse_nist(tag);
      let url = '';
      if (is_control(nisted)) {
        url = nisted.canonize({
          max_specifiers: 2,
          pad_zeros: false,
          add_spaces: false,
          allow_letters: false
        });
        url =
          'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#/control?version=5.1&number=' +
          url;
      }
      return { label: tag, url: url, description: this.descriptionForTag(tag) };
    });
  }
  get cciTags(): Tag[] {
    let cci_tags: string | string[] = this.control.data.tags.cci || '';
    if (!cci_tags || !this.checkedValues.includes('cci')) {
      return [];
    } else if (typeof cci_tags == 'string') {
      cci_tags = cci_tags.split(' ');
    }
    return cci_tags.map((cci) => {
      return { label: cci, url: '', description: this.descriptionForTag(cci) };
    });
  }
  get mappedTags(): Tag[] {
    const tags: Tag[] = [];
    const labelSet: Set<string> = new Set(); // Set to keep track of unique labels
    const mappings = this.mappings;
    const descriptions = this.descriptions;
    for (const key in mappings) {
        if (this.checkedValues.includes(key)) {
            const mapping = mappings[key];
            const type = key.includes('->') ? key.split('->')[0].trim() : key;
            if (type == "CCI") {
                for (const cci of this.control.data.tags.cci || []) {
                    if (mapping[cci]) {
                        const name = key.includes('->') ? key.split('->')[1].trim() : key;
                        mapping[cci].forEach((userMapping) => {
                            const label = `${name}: ${userMapping}`;
                            if (!labelSet.has(label)) {
                                tags.push({
                                    label: label,
                                    url: '',
                                    description: descriptions[key][userMapping]
                                });
                                labelSet.add(label); // Add the label to the set
                            }
                        });
                    }
                }
            } else if (type == "800-53") {
                console.log(this.control.hdf.rawNistTags);
                for (const nistTag of this.control.hdf.rawNistTags || []) {
                    if (mapping[nistTag]) {
                        const name = key.includes('->') ? key.split('->')[1].trim() : key;
                        mapping[nistTag].forEach((userMapping) => {
                            const label = `${name}: ${userMapping}`;
                            if (!labelSet.has(label)) {
                                tags.push({
                                    label: label,
                                    url: '',
                                    description: descriptions[key][userMapping]
                                });
                                labelSet.add(label); // Add the label to the set
                            }
                        });
                    }
                }
            }
        }
    }
    return tags;
  }
  showLegacy(control: ContextualizedControl) {
    let legacyTag = control.data.tags['legacy'];
    if (!legacyTag) {
      return '';
    }
    if (!Array.isArray(legacyTag)) {
      legacyTag = [legacyTag];
    }
    const legacyID = legacyTag.find(
      (ele: unknown) => _.isString(ele) && ele.startsWith('V-')
    );
    return legacyID ? '(' + legacyID + ')' : '';
  }
  // Add the computed property for checkedValues
  get checkedValues(): string[] {
    return this.$store.getters['selectedTags/checkedValues'];
  }
  get mappings(): { [id: string]: { [key: string]: string[] } } {
    return this.$store.getters['mappings/mappings'];
  }
  get descriptions(): { [id: string]: { [mappingName: string]: string } } {
    return this.$store.getters['mappings/descriptions'];
  }
}
</script>
<style scoped>
.checkbox-container {
  text-align: left;
}
.add-mapping-button {
  margin-top: 20px;
  padding: 10px 20px;
  cursor: pointer;
  background-color: blue;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
}
.add-mapping-button:hover {
  background-color: darkblue;
}
</style>
