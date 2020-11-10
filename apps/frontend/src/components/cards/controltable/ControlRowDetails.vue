<template>
  <v-row no-gutters>
    <v-col cols="12" class="font-weight-bold">
      <v-card>
        <v-tabs :value="actual_tab" fixed-tabs show-arrows @change="tab_change">
          <v-tabs-slider />
          <!-- Declare our tabs -->
          <v-tab href="#tab-test"> Test </v-tab>
          <v-tab href="#tab-details"> Details </v-tab>
          <v-tab href="#tab-code"> Code </v-tab>

          <v-tab-item value="tab-test">
            <div class="pa-4">
              <div v-if="caveat">
                {{ caveat }}
                <v-divider />
                <br />
              </div>
              {{ main_desc }}
            </div>
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

//TODO: add line numbers
import 'prismjs';
import 'prismjs/components/prism-makefile.js';
import 'prismjs/components/prism-ruby.js';
//@ts-ignore
import Prism from 'vue-prism-component';
import 'prismjs/themes/prism-tomorrow.css';
Vue.component('Prism', Prism);

import {context} from 'inspecjs';
import {Prop} from 'vue-property-decorator';

interface Detail {
  name: string;
  value: string;
  class?: string;
}

interface CollapsableElement extends Element {
  offsetHeight: Number;
  offsetWidth: Number;
}

@Component({
  components: {
    ControlRowCol,
    Prism
  }
})
export default class ControlRowDetails extends Vue {
  @Prop({type: String}) readonly tab!: string;
  @Prop({type: Object, required: true})
  readonly control!: context.ContextualizedControl;

  local_tab: string = 'tab-test';

  get cciControlString(): string | null {
    let cci = this.control.hdf.wraps.tags.cci;
    if (!cci) {
      return null;
    } else if (Array.isArray(cci)) {
      return cci.join(', ');
    } else {
      return cci;
    }
  }

  get main_desc(): string {
    if (this.control.data.desc) {
      return this.control.data.desc.trim();
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

  /** Shown above the description */
  get header(): string {
    let msg_split = this.control.root.hdf.finding_details.split(':');
    if (msg_split.length === 1) {
      return msg_split[0] + '.';
    } else {
      return msg_split[0] + ':';
    }
  }

  get caveat(): string | undefined {
    return this.control.hdf.descriptions.caveat;
  }

  get details(): Detail[] {
    let c = this.control;
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
        name: 'Caveat',
        value: c.hdf.descriptions.caveat
      },
      {
        name: 'Desc',
        value: c.data.desc
      },
      {
        name: 'Rationale',
        value: c.hdf.descriptions.rationale
      },
      {
        name: 'Justification',
        value: c.hdf.descriptions.justification
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
    ].filter((v) => v.value); // Get rid of nulls
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
