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
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <span>{{ control.finding_details.split(":")[0] }}:</span>
                  <br />
                  <br />
                  <span>{{ control.wraps.desc }}</span>
                </v-col>
              </v-row>
              <v-row
                cols="12"
                v-for="(result, index) in control.wraps.results"
                :key="index"
                :class="zebra(index)"
              >
                <v-col sm="12" md="12" lg="1" xl="1"
                  ><v-card
                    :color="status_color"
                    height="100%"
                    width="100%"
                    tile
                  >
                    <h3>{{ result.status.toUpperCase() }}</h3>
                  </v-card>
                </v-col>
                <v-col v-if="!result.message" cols="11" class="right">
                  <h3>Test</h3>
                  <v-divider> </v-divider>
                  <pre>{{ result.code_desc }}</pre>
                </v-col>
                <v-col v-if="result.message" cols="5" class="right">
                  <h3>Test</h3>
                  <v-divider> </v-divider>
                  <pre>{{ result.code_desc }}</pre>
                </v-col>
                <v-col v-if="result.message" cols="6" class="right">
                  <h3>Result</h3>
                  <v-divider> </v-divider>
                  <pre>{{ result.message }}</pre>
                </v-col>
              </v-row>
            </v-container>
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
import { HDFControl, ControlStatus } from "inspecjs";

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

@Component({
  components: { Prism }
})
export default class ControlRowDetails extends ControlRowDetailsProps {
  get status_color(): string {
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this.control.status.replace(" ", "")}`;
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
.zebra-table {
  background-color: rgba(0, 0, 0, 0.3);
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
