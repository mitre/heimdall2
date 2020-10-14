<template>
  <v-row no-gutters>
    <v-col cols="12" class="font-weight-bold">
      <v-card>
        <v-tabs :value="actual_tab" fixed-tabs show-arrows @change="tab_change">
          <v-tabs-slider />
          <!-- Declare our tabs -->
          <v-tab href="#tab-test">
            Test
          </v-tab>
          <v-tab href="#tab-details">
            Details
          </v-tab>
          <v-tab href="#tab-code">
            Code
          </v-tab>

          <v-tab-item value="tab-test">
            <v-clamp class="pa-1" autoresize :max-lines="2">
              <template slot="default">{{ header }}</template>
              <template slot="after" slot-scope="{toggle, expanded, clamped}">
                <v-icon
                  v-if="!expanded && clamped"
                  fab
                  right
                  medium
                  @click="toggle"
                >
                  mdi-plus-box
                </v-icon>
                <v-icon v-if="expanded" fab right medium @click="toggle">
                  mdi-minus-box
                </v-icon>
              </template>
            </v-clamp>
            <v-spacer />
            <v-divider />
            <br />
            <v-clamp class="pb-2" autoresize :max-lines="2">
              <template slot="default">{{ main_desc }}</template>
              <template slot="after" slot-scope="{toggle, expanded, clamped}">
                <v-icon
                  v-if="!expanded && clamped"
                  fab
                  right
                  medium
                  @click="toggle"
                >
                  mdi-plus-box
                </v-icon>
                <v-icon v-if="expanded" fab right medium @click="toggle">
                  mdi-minus-box
                </v-icon>
              </template>
            </v-clamp>
            <ControlRowCol
              v-for="(result, index) in control.root.hdf.segments"
              :key="'col' + index"
              :class="zebra(index)"
              :result="result"
              :status-code="result.status"
            />
          </v-tab-item>

          <v-tab-item value="tab-details">
            <v-container fluid>
              <!-- Create a row for each detail -->
              <template v-for="(detail, index) in details">
                <v-row :key="'tab' + index" :class="zebra(index)">
                  <v-col cols="12" :class="detail.class">
                    <h3>{{ detail.name }}:</h3>
                    <h4 class="mono preserve-whitespace">{{ detail.value }}</h4>
                  </v-col>
                  <v-divider />
                </v-row>
              </template>
            </v-container>
          </v-tab-item>

          <v-tab-item value="tab-code">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <prism language="ruby">{{ control.full_code }}</prism>
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>
        </v-tabs>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import ControlRowCol from '@/components/cards/controltable/ControlRowCol.vue';

//@ts-ignore
import VClamp from 'vue-clamp/dist/vue-clamp.js';

//TODO: add line numbers
import 'prismjs';
import 'prismjs/components/prism-makefile.js';
import 'prismjs/components/prism-ruby.js';
//@ts-ignore
import Prism from 'vue-prism-component';
import 'prismjs/themes/prism-tomorrow.css';
Vue.component('prism', Prism);

import 'prismjs/components/prism-ruby.js';
import {context} from 'inspecjs';

interface Detail {
  name: string;
  value: string;
  class?: string;
}

// We declare the props separately to make props types inferable.
const ControlRowDetailsProps = Vue.extend({
  props: {
    tab: {
      type: String,
      required: false,
      default: null
    },
    control: {
      type: Object, // Of type context.ContextualizedControl
      required: true
    }
  }
});

interface CollapsableElement extends Element {
  offsetHeight: Number;
  offsetWidth: Number;
}

@Component({
  components: {
    ControlRowCol,
    VClamp,
    Prism
  }
})
export default class ControlRowDetails extends ControlRowDetailsProps {
  clamped: boolean = false;
  expanded: boolean = false;
  local_tab: string = 'tab-test';

  /** Typed getter aroun control prop */
  get _control(): context.ContextualizedControl {
    return this.control;
  }

  get cciControlString(): string | null {
    let cci = this._control.hdf.wraps.tags.cci;
    if (!cci) {
      return null;
    } else if (Array.isArray(cci)) {
      return cci.join(', ');
    } else {
      return cci;
    }
  }

  get main_desc(): string {
    if (this._control.data.desc) {
      return this._control.data.desc.trim();
    } else {
      return 'No description';
    }
  }

  tab_change(tab: string) {
    this.local_tab = tab;
    this.$emit('update:tab', tab);
  }

  get actual_tab(): string {
    if (this.tab === null) {
      return this.local_tab;
    } else {
      return this.tab;
    }
  }

  // Checks if an element has been clamped
  isClamped(el: CollapsableElement | undefined | null) {
    if (!el) {
      return false;
    }
    return el.offsetHeight < el.scrollHeight || el.offsetWidth < el.scrollWidth;
  }

  mounted() {
    // Wait until nextTick to ensure that element has been rendered and clamping
    // applied, otherwise it may show up as null or 0.
    var that = this;
    this.$nextTick(function() {
      that.clamped = this.isClamped(this.$refs.desc as CollapsableElement);
    });
  }

  /** Shown above the description */
  get header(): string {
    let msg_split = this._control.root.hdf.finding_details.split(':');
    if (msg_split.length === 1) {
      return msg_split[0] + '.';
    } else {
      return msg_split[0] + ':';
    }
  }

  get details(): Detail[] {
    let c = this._control;
    return [
      {
        name: 'Control',
        value: c.data.id
      },
      {
        name: 'Title',
        value: c.data.title
      },
      {
        name: 'Desc',
        value: c.data.desc
      },
      {
        name: 'Severity',
        value: c.root.hdf.severity
      },
      {
        name: 'Impact',
        value: c.data.impact
      },
      {
        name: 'Nist controls',
        value: c.hdf.raw_nist_tags.join(', ')
      },
      {
        name: 'CCI controls',
        value: this.cciControlString
      },
      {
        name: 'Check Text',
        value: c.hdf.descriptions.check || c.data.tags.check
      },
      {
        name: 'Fix Text',
        value: c.hdf.descriptions.fix || c.data.tags.fix
      }
    ].filter(v => v.value); // Get rid of nulls
  }

  //for zebra background
  zebra(ix: number): string {
    if (ix % 2 == 0) {
      return 'zebra-table';
    }
    return 'non-zebra-table';
  }
}
</script>

<style lang="scss" scoped>
@import '@/sass/control-row-format.scss';

.clickable {
  cursor: pointer;
}

.v-application {
  code.language-ruby {
    border: none;
    box-shadow: none;
  }
}

pre {
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}
.theme--dark .zebra-table {
  background-color: var(--v-secondary-lighten2);
  max-width: 99.9%;
  margin: auto;
}

.theme--dark .non-zebra-table {
  max-width: 99.9%;
  margin: auto;
}

.code-card {
  height: inherit;
  margin: inherit;
  white-space: auto;
}
.wset {
  min-width: 125px;
  justify-content: center;
}

.right {
  margin-left: -1px;
}
</style>
