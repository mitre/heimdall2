<template>
  <!-- Need to catch for ResponsiveRowSwitch @toggle events for small view -->
  <ResponsiveRowSwitch>
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

    <template #severity>
      <v-card-text class="pa-2">
        <v-icon v-for="i in severity_arrow_count" :key="'sev0' + i" small
          >mdi-checkbox-blank-circle</v-icon
        >
        <v-icon v-for="i in 4 - severity_arrow_count" :key="'sev1' + i" small
          >mdi-checkbox-blank-circle-outline</v-icon
        >
        <br />
        <v-divider class="lighten-4 mx-1"></v-divider>
        {{ control.hdf.severity.toUpperCase() }}
      </v-card-text>
    </template>

    <template #title>
      <v-clamp class="pa-2 title" autoresize :max-lines="4">
        <template slot="default">{{ control.data.title }}</template>
        <template slot="after" slot-scope="{toggle, expanded, clamped}">
          <v-icon v-if="!expanded && clamped" fab right medium @click="toggle"
            >mdi-plus-box</v-icon
          >
          <v-icon v-if="expanded" fab right medium @click="toggle"
            >mdi-minus-box</v-icon
          >
        </template>
      </v-clamp>
    </template>

    <!-- ID and Tags -->
    <template #id>
      <v-card-text class="pa-2 title font-weight-bold">
        {{ control.data.id }}
      </v-card-text>
    </template>
    <template #tags>
      <v-chip-group column active-class="NONE">
        <v-tooltip v-for="(tag, i) in all_tags" :key="'chip' + i" bottom>
          <template v-slot:activator="{on}">
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
    </template>
  </ResponsiveRowSwitch>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {nist} from 'inspecjs';
import ResponsiveRowSwitch from '@/components/cards/controltable/ResponsiveRowSwitch.vue';
import {context} from 'inspecjs';
import {NIST_DESCRIPTIONS, nist_canon_config} from '@/utilities/nist_util';
import {CCI_DESCRIPTIONS} from '@/utilities/cci_util';

import {is_control} from 'inspecjs/dist/nist';
//@ts-ignore
import VClamp from 'vue-clamp/dist/vue-clamp.js';

interface Tag {
  label: string;
  url: string;
  description: string;
}

// We declare the props separately to make props types inferable.
const ControlRowHeaderProps = Vue.extend({
  props: {
    control: {
      type: Object, // Of type HDFControl (but with added key field)
      required: true
    },
    controlExpanded: {
      type: Boolean, // Whether or this control should be open
      required: false
    }
  }
});

@Component({
  components: {
    ResponsiveRowSwitch,
    VClamp
  }
})
export default class ControlRowHeader extends ControlRowHeaderProps {
  /** Typed getter for control */
  get _control(): context.ContextualizedControl {
    return this.control;
  }

  get truncated_title(): string {
    if (this._control.data.title && this._control.data.title.length > 80) {
      return this._control.data.title.substr(0, 80) + '...';
    } else {
      return this._control.data.title || 'Untitled';
    }
  }

  get status_color(): string {
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this._control.root.hdf.status.replace(' ', '')}`;
  }

  get severity_arrow_count(): number {
    switch (this._control.hdf.severity) {
      default:
      case 'none':
        return 0;
      case 'low':
        return 1;
      case 'medium':
        return 2;
      case 'high':
        return 3;
      case 'critical':
        return 4;
    }
  }

  fmtNist(nist: string[]): string {
    return nist.join(', ');
  }

  // Get NIST tag description for NIST tag, this is pulled from the 800-53 xml
  // and relies on a script not contained in the project
  descriptionForTag(tag: string): string {
    let nisted = nist.parse_nist(tag);
    if (is_control(nisted)) {
      let canon = nisted.canonize(nist_canon_config);
      let found = NIST_DESCRIPTIONS[canon];
      if (found) {
        return found;
      }
    } else if (CCI_DESCRIPTIONS[tag.toUpperCase()]) {
      return CCI_DESCRIPTIONS[tag.toUpperCase()].def;
    }
    return 'Unrecognized Tag';
  }

  get all_tags(): Tag[] {
    let nist_tags = this._control.hdf.raw_nist_tags;
    nist_tags = nist_tags.filter(tag => tag.search(/Rev.*\d/i) == -1);
    let nist_tag_objects = nist_tags.map(tag => {
      let nisted = nist.parse_nist(tag);
      let url = '';
      if (nist.is_control(nisted)) {
        url = nisted.canonize({
          max_specifiers: 2,
          pad_zeros: false,
          add_spaces: false,
          allow_letters: false
        });
        url = 'https://nvd.nist.gov/800-53/Rev4/control/' + url;
      }
      return {label: tag, url: url, description: this.descriptionForTag(tag)};
    });
    let cci_tags: string | string[] = this._control.data.tags.cci || '';
    if (!cci_tags) {
      return nist_tag_objects;
    } else if (typeof cci_tags == 'string') {
      cci_tags = cci_tags.split(' ');
    }
    let cci_tag_objects = cci_tags.map(cci => {
      return {label: cci, url: '', description: this.descriptionForTag(cci)};
    });
    return [...nist_tag_objects, ...cci_tag_objects];
  }
}
</script>

<style scoped>
.lightened-row .v-card {
  background: var(--v-background-lighten-2);
}
</style>
