<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :search="search"
    :single-expand="singleExpand"
    :expanded.sync="expanded"
    item-key="vuln_num"
    show-expand
    class="my-4 px-4"
  >
    <template v-slot:item.status="{ item }">
      <v-chip :color="getColor(item.status)" :label="true" class="wset">
        {{ item.status }}
      </v-chip>
    </template>
    <template v-slot:item.nist_tags="{ item }">
      {{ getNist(item.nist_tags) }}
    </template>

    <template v-slot:top>
      <v-toolbar flat>
        <v-text-field
          v-model="search"
          append-icon="search"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-switch
          v-model="singleExpand"
          label="Single expand"
          class="mt-2"
        ></v-switch>
      </v-toolbar>
    </template>
    <template v-slot:expanded-item="{ headers, item }">
      <td :colspan="headers.length">
        <v-card class="ma-auto pa-auto" outlined>
          <v-tabs>
            <v-tab>Test Details</v-tab>
            <v-tab-item>
              <v-container>
                <v-row class="newline">
                  <v-col cols="12">
                    <span>{{ item.finding_details.split(":")[0] }}:</span>
                    <br />
                    <br />
                    <span>{{ item.wraps.desc }}</span>
                  </v-col>
                </v-row>
                <br />
                <v-row
                  v-for="(result, index) in item.wraps.results"
                  :key="index"
                >
                  <v-col cols="1" class="stripes">{{
                    result.status.toUpperCase()
                  }}</v-col>
                  <v-col cols="5.5" class="stripes right">
                    <!--<prism language="ruby">Test: {{ result.code_desc }}</prism>-->
                    <prism language="ruby" class="test">
                      {{ result.code_desc }}
                    </prism>
                  </v-col>
                  <v-col v-if="result.message" cols="5.5" class="stripes right">
                    <!--<prism language="ruby">Message: {{ result.message }}</prism>-->
                    <prism language="ruby" class="test">
                      {{ result.message }}
                    </prism>
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>

            <v-tab>Details</v-tab>
            <v-tab-item>
              <v-container>
                <v-row>
                  <v-col cols="1">Control:</v-col>
                  <v-col cols="11">{{ item.wraps.id }}</v-col>
                </v-row>
                <v-divider></v-divider>
                <v-row>
                  <v-col cols="1">Title:</v-col>
                  <v-col cols="11">{{ item.wraps.title }}</v-col>
                </v-row>
                <v-divider></v-divider>
                <v-row>
                  <v-col cols="1">Desc:</v-col>
                  <v-col cols="11">{{ item.wraps.desc }}</v-col>
                </v-row>
                <v-divider></v-divider>
                <v-row>
                  <v-col cols="1">Severity:</v-col>
                  <v-col cols="11">{{ item.severity }}</v-col>
                </v-row>
                <v-divider></v-divider>
                <v-row>
                  <v-col cols="1">Impact:</v-col>
                  <v-col cols="11">{{ item.wraps.impact }}</v-col>
                </v-row>
                <v-divider></v-divider>
                <v-row>
                  <v-col cols="1">Nist Ref:</v-col>
                  <v-col cols="11">{{ getNist(item.nist_tags) }}</v-col>
                </v-row>
                <v-divider></v-divider>
                <v-row>
                  <v-col cols="1">Check Text:</v-col>
                  <v-col cols="11" class="newline">{{
                    item.wraps.tags.check
                  }}</v-col>
                </v-row>
                <v-divider></v-divider>
                <v-row>
                  <v-col cols="1">Fix Text:</v-col>
                  <v-col cols="11" class="newline">{{
                    item.wraps.tags.fix
                  }}</v-col>
                </v-row>
              </v-container>
            </v-tab-item>

            <v-tab>Inspec Code</v-tab>
            <v-tab-item>
              <!--<prism language="ruby">{{ item.wraps.code }}</prism>-->
              <prism language="ruby" class="test2">{{ item.wraps.code }}</prism>
            </v-tab-item>
          </v-tabs>
        </v-card>
      </td>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import InspecDataModule from "../store/data_store";
import { hdfWrapControl, HDFControl } from "inspecjs";

//TODO: add line numbers
import "prismjs";
import Prism from "vue-prism-component";
//import Prism from "prismjs";
//Prism.highlightAll();
//var nw = Prism.plugins.NormalizeWhitespace;

import "prismjs/themes/prism.css";
import "prismjs/components/prism-ruby.js";

interface Header {
  text: string;
  value: string;
  align?: "left" | "right"; // TODO: Find more
  sortable?: boolean;
}
// We declare the props separately to make props types inferable.
const ControlTableProps = Vue.extend({
  props: {}
});

@Component({
  components: { Prism }
})
export default class ControlTable extends ControlTableProps {
  get items() {
    let temp = getModule(InspecDataModule, this.$store);
    var arr = temp.contextualControls.map((item: any) => {
      return item.data;
    });
    for (var i = 0; i < arr.length; i++) arr[i] = hdfWrapControl(arr[i]);
    return arr;
  }
  getColor(def: string) {
    var color;
    switch (def) {
      case "Passed":
        color = "#0f0";
        break;
      case "Failed":
        color = "#f00";
        break;
      case "Not Applicable":
        color = "#00f";
        break;
      case "Not Reviewed":
        color = "#888";
        break;
      case "Profile Error":
        color = "#000";
        break;
      default:
        color = null;
    }
    return color;
  }
  getNist(nist: any) {
    return nist.join(", ");
  }
  expanded: any[] = [];
  search: string = "";
  singleExpand: boolean = false;
  var: boolean = false;
  headers: Header[] = [
    {
      text: "Status",
      align: "left",
      value: "status"
    },
    { text: "Title", value: "wraps.title" },
    { text: "Control ID", value: "vuln_num" },
    { text: "Severity", value: "severity" },
    { text: "NIST SP 800-53", value: "nist_tags" }
  ];
}
</script>

<style scoped>
.newline {
  white-space: pre;
}
.wset {
  min-width: 125px;
  justify-content: center;
}

.test {
  white-space: pre-wrap;
  max-width: 500px;
  word-wrap: break-word;
}
.test2 {
  white-space: pre-wrap;
  max-width: 600px;
  word-wrap: break-word;
}
code[class*="language-"] {
  word-break: break-word;
}
code[class*="test2"] {
  background-color: #000;
}
div[class*="stripes"] {
  border-style: solid;
  border-width: 1px;
}
.right {
  margin-left: -1px;
}
</style>
