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
        <v-divider class="mx-1" />
        {{ control.hdf.severity.toUpperCase() }}
      </v-card-text>
    </template>

    <template #title>
      <div class="pa-2 title">{{ control.data.title }}</div>
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
export default class ControlRowHeader extends Vue {
  @Prop({type: Object, required: true})
  readonly control!: context.ContextualizedControl;
  @Prop({type: Boolean, default: false}) readonly controlExpanded!: boolean;

  /** Typed getter for control */
  get _control(): context.ContextualizedControl {
    return this.control;
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

  get severity_arrow_count(): number {
    switch (this.control.hdf.severity) {
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
    let nist_tags = this.control.hdf.raw_nist_tags;
    nist_tags = nist_tags.filter((tag) => tag.search(/Rev.*\d/i) == -1);
    let nist_tag_objects = nist_tags.map((tag) => {
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
    let cci_tags: string | string[] = this.control.data.tags.cci || '';
    if (!cci_tags) {
      return nist_tag_objects;
    } else if (typeof cci_tags == 'string') {
      cci_tags = cci_tags.split(' ');
    }
    let cci_tag_objects = cci_tags.map((cci) => {
      return {label: cci, url: '', description: this.descriptionForTag(cci)};
    });
    return [...nist_tag_objects, ...cci_tag_objects];
  }
}
</script>
