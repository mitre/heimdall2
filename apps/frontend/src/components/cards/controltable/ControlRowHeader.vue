<template>
  <!-- Need to catch for ResponsiveRowSwitch @toggle events for small view -->
  <div v-if=is_stig_result()>
    <ResponsiveRowSwitch :assessment_type="assessment_type" :dense="true">
      <template #status>
        <v-card :color="status_color" class="pl-2 font-weight-bold" hover @click="$emit('toggle', !controlExpanded)">
          <v-card-text class="pa-2 font-weight-bold">
            {{ control.root.hdf.status }}
            <v-icon class="float-right">
              {{ controlExpanded? 'mdi-chevron-up': 'mdi-chevron-down' }}
            </v-icon>
          </v-card-text>
        </v-card>
        <!-- put this logic tied to the overide validation peice-->
        <div v-if=override_validation>
          <div v-if="isFailingNoOverride">
            <v-btn
            class="ma-2"
            color="#424242"
            width="170"
            depressed
            >
              Unassessed
              <v-icon dark right color="red">
                mdi-cancel
              </v-icon>
            </v-btn>
          </div>
          <div v-else-if="hasControlStatusOverride">
            <div v-if="isAnyOverrideUnapproved">
              <v-btn
              class="ma-2"
              color="#424242"
              width="170"
              depressed
              >
              Unapproved
              <v-icon
              dark
              right
              color="orange">
                mdi-alert-circle-outline
              </v-icon>
            </v-btn>
            </div>
            <div v-else>
              <v-btn
              class="ma-2"
              color="#424242"
              width="170"
              depressed
              >
                Override
                <v-icon dark right color="green">
                  mdi-checkbox-marked-circle
                </v-icon>
              </v-btn>
            </div>
          </div>
        </div>

      </template>

      <template #set>
        <v-row class="pa-4">
          <div class="pa-2 title" :style="$vuetify.breakpoint.lgAndUp ? 'width: 15vw' : 'width:20vw'"
            v-text="filename" />
          <v-tooltip v-if="isOverlaid" bottom>
            <template #activator="{ on, attrs }">
              <v-icon style="cursor: pointer" class="ml-2" v-bind="attrs" v-on="on">mdi-delta</v-icon>
            </template>
            <span>This control has been modified in an overlay</span>
          </v-tooltip>
        </v-row>
      </template>

      <template #compResultSource>
        <div class="pa-2 title" v-html="sanitize_html(control.hdf.parsedResultSourceTags)" />
      </template>

      <template #compCWE>
        <div class="pa-2 title" v-html="sanitize_html(control.data.tags.cwe)" />
      </template>

      <template #compVulnID>
        <div class="pa-2 title" v-html="sanitize_html(control.data.tags.gid)" />
      </template>

      <template #severity>
        <v-card-text class="pa-2">
          <div v-if="showImpact">
            <CircleRating :filled-count="severity_arrow_count(control.hdf.severity)" :total-count="4" />
            <v-divider class="mx-1" />
            {{ (control.hdf.severity || 'none').toUpperCase() }}
          </div>
          <div v-else>
            <CircleRating :filled-count="severity_arrow_count(control.data.tags.severity)" :total-count="4" />
            <br />
            <v-divider class="mx-1" />
            {{ (control.data.tags.severity || 'none').toUpperCase() }}
          </div>
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
            {{ control.data.tags.stig_id }}
          </div>
          <div v-if="showLegacy(control)">
            {{ showLegacy(control) }}
          </div>
        </v-card-text>
      </template>
      <template #tags>
        <v-chip-group column active-class="NONE">
          <v-tooltip v-for="(tag, i) in nistTags" :key="'nist-chip' + i" bottom>
            <template #activator="{ on }">
              <v-chip :href="tag.url" target="_blank" active-class="NONE" v-on="on">
                {{ tag.label }}
              </v-chip>
            </template>
            <span>{{ tag.description }}</span>
          </v-tooltip>
        </v-chip-group>
        <v-chip-group column active-class="NONE">
          <v-tooltip v-for="(tag, i) in cciTags" :key="'cci-chip' + i" bottom>
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
        }}</v-card-text></template>

      <template #viewed>
        <v-container class="py-0 my-0 fill-height">
          <v-layout class="py-0 my-0" :justify-center="$vuetify.breakpoint.lgAndUp"
            :align-center="$vuetify.breakpoint.lgAndUp">
            <v-checkbox v-model="wasViewed" class="align-center justify-center py-0 my-0 pl-0" hide-details
              :label="$vuetify.breakpoint.lgAndUp ? '' : 'Viewed'" />
          </v-layout>
        </v-container>
      </template>
    </ResponsiveRowSwitch>
  </div>
  <div v-else-if=is_gen_result()>
    <!-- General, Vuln, and Default are the same -->
    <ResponsiveRowSwitch :assessment_type="assessment_type" :dense="true">
      <template #status>
        <v-card :color="status_color" class="pl-2 font-weight-bold" hover @click="$emit('toggle', !controlExpanded)">
          <v-card-text class="pa-2 font-weight-bold">
            {{ control.root.hdf.status }}
            <v-icon class="float-right">
              {{ controlExpanded? 'mdi-chevron-up': 'mdi-chevron-down' }}
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
              >mdi-delta</v-icon
            >
            </template>
            <span>This control has been modified in an overlay</span>
          </v-tooltip>
        </v-row>
      </template>

      <template #compResultSource>
        <div class="pa-2 title" v-html="sanitize_html(control.hdf.parsedResultSourceTags)" />
      </template>

      <template #compCWE>
        <div class="pa-2 title" v-html="sanitize_html(control.data.tags.cwe)" />
      </template>

      <!-- <template #compVulnID>
          <div class="pa-2 title" v-html="sanitize_html(control.data.tags.gid)" />
        </template> -->

      <template #severity>
        <v-card-text class="pa-2">
          <div v-if="showImpact">
          <CircleRating
            :filled-count="severity_arrow_count(control.hdf.severity)"
            :total-count="4"
          />
            <v-divider class="mx-1" />
            {{ (control.hdf.severity || 'none').toUpperCase() }}
          </div>
          <div v-else>
          <CircleRating
            :filled-count="severity_arrow_count(control.data.tags.severity)"
            :total-count="4"
          />
            <br />
            <v-divider class="mx-1" />
            {{ (control.data.tags.severity || 'none').toUpperCase() }}
          </div>
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
        <v-chip-group column active-class="NONE">
          <v-tooltip v-for="(tag, i) in cciTags" :key="'cci-chip' + i" bottom>
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
      }}</v-card-text></template
    >

      <template #viewed>
        <v-container class="py-0 my-0 fill-height">
          <v-layout class="py-0 my-0" :justify-center="$vuetify.breakpoint.lgAndUp"
            :align-center="$vuetify.breakpoint.lgAndUp">
            <v-checkbox v-model="wasViewed" class="align-center justify-center py-0 my-0 pl-0" hide-details
              :label="$vuetify.breakpoint.lgAndUp ? '' : 'Viewed'" />
          </v-layout>
        </v-container>
      </template>
    </ResponsiveRowSwitch>
  </div>
  <div v-else-if=is_vuln_result()>
    <!-- General, Vuln, and Default are the same -->
    <ResponsiveRowSwitch :assessment_type="assessment_type" :dense="true">
      <template #status>
        <v-card :color="status_color" class="pl-2 font-weight-bold" hover @click="$emit('toggle', !controlExpanded)">
          <v-card-text class="pa-2 font-weight-bold">
            {{ control.root.hdf.status }}
            <v-icon class="float-right">
              {{ controlExpanded? 'mdi-chevron-up': 'mdi-chevron-down' }}
            </v-icon>
          </v-card-text>
        </v-card>
      </template>

      <template #set>
        <v-row class="pa-4">
          <div class="pa-2 title" :style="$vuetify.breakpoint.lgAndUp ? 'width: 15vw' : 'width:20vw'"
            v-text="filename" />
          <v-tooltip v-if="isOverlaid" bottom>
            <template #activator="{ on, attrs }">
              <v-icon style="cursor: pointer" class="ml-2" v-bind="attrs" v-on="on">mdi-delta</v-icon>
            </template>
            <span>This control has been modified in an overlay</span>
          </v-tooltip>
        </v-row>
      </template>

      <template #compResultSource>
        <div class="pa-2 title" v-html="sanitize_html(control.hdf.parsedResultSourceTags)" />
      </template>

      <template #compCWE>
        <div class="pa-2 title" v-html="sanitize_html(control.data.tags.cwe)" />
      </template>

      <template #compVulnID>
        <div class="pa-2 title" v-html="sanitize_html(control.data.tags.gid)" />
      </template>

      <template #severity>
        <v-card-text class="pa-2">
          <div v-if="showImpact">
            <CircleRating :filled-count="severity_arrow_count(control.hdf.severity)" :total-count="4" />
            <v-divider class="mx-1" />
            {{ (control.hdf.severity || 'none').toUpperCase() }}
          </div>
          <div v-else>
            <CircleRating :filled-count="severity_arrow_count(control.data.tags.severity)" :total-count="4" />
            <br />
            <v-divider class="mx-1" />
            {{ (control.data.tags.severity || 'none').toUpperCase() }}
          </div>
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
            <template #activator="{ on }">
              <v-chip :href="tag.url" target="_blank" active-class="NONE" v-on="on">
                {{ tag.label }}
              </v-chip>
            </template>
            <span>{{ tag.description }}</span>
          </v-tooltip>
        </v-chip-group>
        <v-chip-group column active-class="NONE">
          <v-tooltip v-for="(tag, i) in cciTags" :key="'cci-chip' + i" bottom>
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
        }}</v-card-text></template>

      <template #viewed>
        <v-container class="py-0 my-0 fill-height">
          <v-layout class="py-0 my-0" :justify-center="$vuetify.breakpoint.lgAndUp"
            :align-center="$vuetify.breakpoint.lgAndUp">
            <v-checkbox v-model="wasViewed" class="align-center justify-center py-0 my-0 pl-0" hide-details
              :label="$vuetify.breakpoint.lgAndUp ? '' : 'Viewed'" />
          </v-layout>
        </v-container>
      </template>
    </ResponsiveRowSwitch>
  </div>
  <div v-else>
    <!-- General, Vuln, and Default are the same -->
    <ResponsiveRowSwitch :assessment_type="assessment_type" :dense="true">
      <template #status>
        <v-card :color="status_color" class="pl-2 font-weight-bold" hover @click="$emit('toggle', !controlExpanded)">
          <v-card-text class="pa-2 font-weight-bold">
            {{ control.root.hdf.status }}
            <v-icon class="float-right">
              {{ controlExpanded? 'mdi-chevron-up': 'mdi-chevron-down' }}
            </v-icon>
          </v-card-text>
        </v-card>
      </template>

      <template #set>
        <v-row class="pa-4">
          <div class="pa-2 title" :style="$vuetify.breakpoint.lgAndUp ? 'width: 15vw' : 'width:20vw'"
            v-text="filename" />
          <v-tooltip v-if="isOverlaid" bottom>
            <template #activator="{ on, attrs }">
              <v-icon style="cursor: pointer" class="ml-2" v-bind="attrs" v-on="on">mdi-delta</v-icon>
            </template>
            <span>This control has been modified in an overlay</span>
          </v-tooltip>
        </v-row>
      </template>

      <template #compResultSource>
        <div class="pa-2 title" v-html="sanitize_html(control.hdf.parsedResultSourceTags)" />
      </template>

      <template #compCWE>
        <div class="pa-2 title" v-html="sanitize_html(control.data.tags.cwe)" />
      </template>

      <template #compVulnID>
        <div class="pa-2 title" v-html="sanitize_html(control.data.tags.gid)" />
      </template>

      <template #severity>
        <v-card-text class="pa-2">
          <div v-if="showImpact">
            <CircleRating :filled-count="severity_arrow_count(control.hdf.severity)" :total-count="4" />
            <v-divider class="mx-1" />
            {{ (control.hdf.severity || 'none').toUpperCase() }}
          </div>
          <div v-else>
            <CircleRating :filled-count="severity_arrow_count(control.data.tags.severity)" :total-count="4" />
            <br />
            <v-divider class="mx-1" />
            {{ (control.data.tags.severity || 'none').toUpperCase() }}
          </div>
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
            <template #activator="{ on }">
              <v-chip :href="tag.url" target="_blank" active-class="NONE" v-on="on">
                {{ tag.label }}
              </v-chip>
            </template>
            <span>{{ tag.description }}</span>
          </v-tooltip>
        </v-chip-group>
        <v-chip-group column active-class="NONE">
          <v-tooltip v-for="(tag, i) in cciTags" :key="'cci-chip' + i" bottom>
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
        }}</v-card-text></template>

      <template #viewed>
        <v-container class="py-0 my-0 fill-height">
          <v-layout class="py-0 my-0" :justify-center="$vuetify.breakpoint.lgAndUp"
            :align-center="$vuetify.breakpoint.lgAndUp">
            <v-checkbox v-model="wasViewed" class="align-center justify-center py-0 my-0 pl-0" hide-details
              :label="$vuetify.breakpoint.lgAndUp ? '' : 'Viewed'" />
          </v-layout>
        </v-container>
      </template>
    </ResponsiveRowSwitch>
  </div>

</template>

<script lang="ts">
import ResponsiveRowSwitch from '@/components/cards/controltable/ResponsiveRowSwitch.vue';
import CircleRating from '@/components/generic/CircleRating.vue';
import HtmlSanitizeMixin from '@/mixins/HtmlSanitizeMixin';
import {CCI_DESCRIPTIONS} from '@/utilities/cci_util';
import {getControlRunTime} from '@/utilities/delta_util';
import {nistCanonConfig, NIST_DESCRIPTIONS} from '@/utilities/nist_util';
import {ContextualizedControl, is_control, parse_nist} from 'inspecjs';
import * as _ from 'lodash';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import { CCI_DESCRIPTIONS } from '@/utilities/cci_util';
import { getControlRunTime } from '@/utilities/delta_util';
import { nistCanonConfig, NIST_DESCRIPTIONS } from '@/utilities/nist_util';
import { ContextualizedControl, is_control, parse_nist } from 'inspecjs';
import _ from 'lodash';
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

interface Tag {
  label: string;
  url: string;
  description: string;
}

@Component({
  components: {
    ResponsiveRowSwitch,
    CircleRating
  }
})
export default class ControlRowHeader extends mixins(HtmlSanitizeMixin) {
  @Prop({ type: Object, required: true })
  readonly control!: ContextualizedControl;

  @Prop({ type: String, required: false, default: String("general") }) assessment_type!: String;
  @Prop({ type: Boolean, required: false, default: false }) override_validation!: Boolean;

  @Prop({ type: Array, required: true })
  readonly viewedControls!: string[];

  @Prop({ type: Boolean, default: false }) readonly controlExpanded!: boolean;
  @Prop({ type: Boolean, default: false }) readonly showImpact!: boolean;


  //Assessment Type Determiniation
  is_stig_result() {
    return this.assessment_type === 'stig';
  }

  is_gen_result() {
    return this.assessment_type === 'general';
  }
  
  is_vuln_result() {
    return this.assessment_type === 'vuln';
  }


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

  get isFailingNoOverride(){
      if (this.control.hdf.status === 'Failed' && !this.hasControlStatusOverride ){
        return true;
      }
      return false;
  }

  get isAnyOverrideUnapproved(): boolean{
    if (this.control.hdf.hasControlStatusOverride){
      return !this.control.hdf.isOverideStatusApproved;
    }
    return false;
  }

  get isOverrideApproveD(): boolean{
    return this.control.hdf.isOverideStatusApproved
  }

  get hasControlStatusOverride(): boolean {
      return this.control.hdf.hasControlStatusOverride;
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
          'https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_1_0/home?element=' +
          url;
      }
      return { label: tag, url: url, description: this.descriptionForTag(tag) };
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
      return { label: cci, url: '', description: this.descriptionForTag(cci) };
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
