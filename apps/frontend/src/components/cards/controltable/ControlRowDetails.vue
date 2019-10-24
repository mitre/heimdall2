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
            <v-clamp autoresize :max-lines="2">
              <template slot="default">{{ header }}</template>
              <template slot="after" slot-scope="{ toggle, expanded, clamped }">
                <v-icon
                  fab
                  v-if="!expanded && clamped"
                  right
                  medium
                  @click="toggle"
                >
                  add_box
                </v-icon>
                <v-icon fab v-if="expanded" right medium @click="toggle">
                  indeterminate_check_box
                </v-icon>
              </template>
            </v-clamp>
            <v-spacer></v-spacer>
            <v-divider></v-divider>
            <br />
            <v-clamp autoresize :max-lines="2">
              <template slot="default">{{
                control.wraps.desc.trim()
              }}</template>
              <template slot="after" slot-scope="{ toggle, expanded, clamped }">
                <v-icon
                  fab
                  v-if="!expanded && clamped"
                  right
                  medium
                  @click="toggle"
                >
                  add_box
                </v-icon>
                <v-icon fab v-if="expanded" right medium @click="toggle">
                  indeterminate_check_box
                </v-icon>
              </template>
            </v-clamp>
            <ControlRowCol
              v-for="(result, index) in control.wraps.results"
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
                    <pre>{{ detail.value }}</pre>
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
                  <prism language="ruby">{{ control.wraps.code }}</prism>
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
import VClamp from "vue-clamp";

//TODO: add line numbers
import "prismjs";
import "prismjs/components/prism-makefile.js";
import "prismjs/components/prism-ruby.js";
//@ts-ignore
import Prism from "vue-prism-component";
Vue.component("prism", Prism);

import "prismjs/components/prism-ruby.js";

interface Detail {
  name: string;
  value: string;
  class?: string;
}

// We declare the props separately to make props types inferable.
const ControlRowDetailsProps = Vue.extend({
  props: {
    control: {
      type: Object, // Of type HDFControl
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
    let msg_split = (this.control as HDFControl).finding_details.split(":");
    if (msg_split.length === 1) {
      return msg_split[0] + ".";
    } else {
      return msg_split[0] + ":";
    }
  }

  get details(): Detail[] {
    return [
      {
        name: "Control",
        value: this.control.wraps.id
      },
      {
        name: "Title",
        value: this.control.wraps.title
      },
      {
        name: "Desc",
        value: this.control.wraps.desc
      },
      {
        name: "Severity",
        value: this.control.severity
      },
      {
        name: "Impact",
        value: this.control.wraps.impact
      },
      {
        name: "Nist",
        value: this.control.nist_tags.join(", ")
      },
      {
        name: "Check Text",
        value: this.control.wraps.tags.check
      },
      {
        name: "Fix Text",
        value: this.control.wraps.tags.fix
      }
    ];
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
