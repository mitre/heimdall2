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
          <template #activator="{on, attrs}">
            <v-icon
              style="cursor: pointer"
              class="ml-2"
              v-bind="attrs"
              v-on="on"
              >mdi-delta</v-icon
            >
          </template>
          <span>This control has been modified in an overlay</span>
        </v-tooltip>
      </v-row>
    </template>

    <template #impact>
      <v-card-text class="pa-2">
        <v-tooltip bottom>
          <template #activator="{on}">
            <span v-on="on">
              <v-chip active-class="NONE" outlined :color="impact_color">
                <v-icon
                  v-if="'severityoverride' in control.data.tags"
                  size="16"
                  class="mr-1"
                  >mdi-delta</v-icon
                >
                {{ Math.floor(control.data.impact * 10) }}
              </v-chip>
            </span>
          </template>
          <span
            >Raw Impact: {{ control.data.impact }}
            <span v-if="'severityoverride' in control.data.tags">
              <br />Impact level differs from severity level<v-icon
                size="16"
                class="ml-1"
                >mdi-delta</v-icon
              >
              <br />
              Severity level:
              {{
                'severity' in control.data.tags
                  ? control.data.tags['severity']
                  : 'UNKNOWN'
              }}
              <br />
              Impact level: {{ control.data.tags['severityoverride'] }} <br />
              <span v-if="'severityjustification' in control.data.tags">
                Justification:{{ control.data.tags['severityjustification'] }}
              </span>
            </span>
          </span>
        </v-tooltip>
      </v-card-text>
    </template>

    <template #severity>
      <v-card-text class="pa-2">
        <v-chip active-class="NONE" outlined :color="severity_color">
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
      <v-chip-group column active-class="NONE">
        <v-tooltip v-for="(tag, i) in nistTags" :key="'nist-chip' + i" bottom>
          <template #activator="{on}">
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
      <v-chip-group column active-class="NONE">
        <v-tooltip v-for="(tag, i) in cciTags" :key="'cci-chip' + i" bottom>
          <template #activator="{on}">
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
      }}</v-card-text></template
    >

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
import {CCI_DESCRIPTIONS} from '@/utilities/cci_util';
import {getControlRunTime} from '@/utilities/delta_util';
import {nistCanonConfig, NIST_DESCRIPTIONS} from '@/utilities/nist_util';
import {ContextualizedControl, is_control, parse_nist} from 'inspecjs';
import * as _ from 'lodash';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

interface Tag {
  label: string;
  url: string;
  description: string;
}

@Component({
  components: {
    ResponsiveRowSwitch
  }
})
export default class ControlRowHeader extends mixins(HtmlSanitizeMixin) {
  @Prop({type: Object, required: true})
  readonly control!: ContextualizedControl;

  @Prop({type: Array, required: true})
  readonly viewedControls!: string[];

  @Prop({type: Boolean, default: false}) readonly controlExpanded!: boolean;

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
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this.control.root.hdf.status.replace(' ', '')}`;
  }

  get impact_color(): string {
    if (this.control.data.impact < 0.1) return 'severityNone';
    else if (this.control.data.impact < 0.4) return 'severityLow';
    else if (this.control.data.impact < 0.7) return 'severityMedium';
    else if (this.control.data.impact < 0.9) return 'severityHigh';
    return 'severityCritical';
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
      return {label: tag, url: url, description: this.descriptionForTag(tag)};
    });
  }

  get cciTags(): Tag[] {
    let cci_tags: string | string[] = this.control.data.tags.cci || '';
    if (!cci_tags) {
      return [];
    } else if (typeof cci_tags == 'string') {
      cci_tags = cci_tags.split(' ');
    }
    return cci_tags.map((cci) => {
      return {label: cci, url: '', description: this.descriptionForTag(cci)};
    });
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
}
</script>
