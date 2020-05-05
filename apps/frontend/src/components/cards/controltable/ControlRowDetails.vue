<template>
  <v-row no-gutters>
    <v-col cols="12" class="font-weight-bold">
      <v-card>
        <v-tabs>
          <v-tabs-slider></v-tabs-slider>
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
              <template slot="after" slot-scope="{ toggle, expanded, clamped }">
                <v-icon
                  fab
                  v-if="!expanded && clamped"
                  right
                  medium
                  @click="toggle"
                >
                  mdi-plus-box
                </v-icon>
                <v-icon fab v-if="expanded" right medium @click="toggle">
                  mdi-minus-box
                </v-icon>
              </template>
            </v-clamp>
            <v-spacer></v-spacer>
            <v-divider></v-divider>
            <br />
            <v-clamp class="pb-2" autoresize :max-lines="2">
              <template slot="default">{{ main_desc }}</template>
              <template slot="after" slot-scope="{ toggle, expanded, clamped }">
                <v-icon
                  fab
                  v-if="!expanded && clamped"
                  right
                  medium
                  @click="toggle"
                >
                  mdi-plus-box
                </v-icon>
                <v-icon fab v-if="expanded" right medium @click="toggle">
                  mdi-minus-box
                </v-icon>
              </template>
            </v-clamp>
            <ControlRowCol
              v-for="(result, index) in control.root.data.results"
              :key="index"
              :class="zebra(index)"
              :result="result"
              :statusCode="result.status"
            >
            </ControlRowCol>
          </v-tab-item>

          <v-tab-item value="tab-details">
            <v-container fluid>
              <!-- Create a row for each detail -->
              <template v-for="(detail, index) in details">
                <v-row :key="index" :class="zebra(index)">
                  <v-col cols="12" :class="detail.class">
                    <h3>{{ detail.name }}:</h3>
                    <h4 class="mono preserve-whitespace">{{ detail.value }}</h4>
                  </v-col>
                  <v-divider> </v-divider>
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
import Vue from "vue";
import Component from "vue-class-component";
import ControlRowCol from "@/components/cards/controltable/ControlRowCol.vue";
import { HDFControl, ControlStatus } from "inspecjs";
//@ts-ignore
import VClamp from "vue-clamp/dist/vue-clamp.js";

//TODO: add line numbers
import "prismjs";
import "prismjs/components/prism-makefile.js";
import "prismjs/components/prism-ruby.js";
//@ts-ignore
import Prism from "vue-prism-component";
Vue.component("prism", Prism);

import "prismjs/components/prism-ruby.js";
import { context } from "inspecjs";

interface Detail {
  name: string;
  value: string;
  class?: string;
}

// We declare the props separately to make props types inferable.
const ControlRowDetailsProps = Vue.extend({
  props: {
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

  /** Typed getter aroun control prop */
  get _control(): context.ContextualizedControl {
    return this.control;
  }

  get main_desc(): string {
    if (this._control.data.desc) {
      return this._control.data.desc.trim();
    } else {
      return "No description";
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
    let msg_split = this._control.root.hdf.finding_details.split(":");
    if (msg_split.length === 1) {
      return msg_split[0] + ".";
    } else {
      return msg_split[0] + ":";
    }
  }

  get details(): Detail[] {
    let c = this._control;
    return [
      {
        name: "Control",
        value: c.data.id
      },
      {
        name: "Title",
        value: c.data.title
      },
      {
        name: "Desc",
        value: c.data.desc
      },
      {
        name: "Severity",
        value: c.root.hdf.severity
      },
      {
        name: "Impact",
        value: c.data.impact
      },
      {
        name: "Nist",
        value: c.hdf.raw_nist_tags.join(", ")
      },
      {
        name: "Check Text",
        value: c.hdf.descriptions.check || c.data.tags.check
      },
      {
        name: "Fix Text",
        value: c.hdf.descriptions.fix || c.data.tags.fix
      }
    ].filter(v => v.value); // Get rid of nulls
  }

  zebra(ix: number): string {
    return ix % 2 ? "" : "zebra-table";
  }
}
</script>

<style lang="scss" scoped>
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
}
.theme--light .zebra-table {
  background-color: var(--v-secondary-lighten1);
}
/*
.v-application code {
  background-color: revert;
  color: revert;
  display: revert;
  font-size: revert;
  -webkit-box-shadow: revert;
  box-shadow: revert;
  border-radius: revert;
  white-space: auto;
  overflow-wrap: break-word;
  max-width: 100%;
}
*/
.code-card {
  height: inherit;
  margin: inherit;
  white-space: auto;
}
.wset {
  min-width: 125px;
  justify-content: center;
}
/*
code[class*="language-"] {
  word-break: break-word;
}
*/
.right {
  margin-left: -1px;
}
</style>
