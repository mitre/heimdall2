<template>
  <v-row>
    <v-col cols="12" sm="12" md="12" lg="1" xl="1">
      <v-layout
        style="margin: 0px"
        fill-height
        :class="status_color"
        justify-center
        align-center
      >
        <v-card :color="status_color" flat>
          <h3>{{ result.status.toUpperCase() }}</h3>
        </v-card>
      </v-layout>
    </v-col>
    <v-col
      v-if="!result.message"
      lg="11"
      xl="11"
      cols="12"
      sm="12"
      md="12"
      class="right"
    >
      <h3 class="pl-2">Test</h3>
      <v-divider></v-divider>
      <v-clamp
        class="pl-2 mono"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.code_desc.trim() }}</template>
        <template slot="after" slot-scope="{ toggle, expanded, clamped }">
          <v-icon fab v-if="!expanded && clamped" right medium @click="toggle"
            >add_box</v-icon
          >
          <v-icon fab v-if="expanded" right medium @click="toggle"
            >indeterminate_check_box</v-icon
          >
        </template>
      </v-clamp>
    </v-col>
    <v-col v-else lg="6" xl="6" sm="6" md="6" xs="6" class="right">
      <h3 class="pl-2">Test</h3>
      <v-divider></v-divider>
      <v-clamp
        class="pl-2 mono"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.code_desc.trim() }}</template>
        <template slot="after" slot-scope="{ toggle, expanded, clamped }">
          <v-icon fab v-if="!expanded && clamped" right medium @click="toggle"
            >add_box</v-icon
          >
          <v-icon fab v-if="expanded" right medium @click="toggle"
            >indeterminate_check_box</v-icon
          >
        </template>
      </v-clamp>
    </v-col>
    <v-col
      v-if="result.message"
      cols="6"
      sm="6"
      md="6"
      lg="5"
      xl="5"
      class="right"
    >
      <h3 class="pl-2">Result</h3>
      <v-divider></v-divider>
      <v-clamp
        class="pl-2 mono"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.message.trim() }}</template>
        <template slot="after" slot-scope="{ toggle, expanded, clamped }">
          <v-icon fab v-if="!expanded && clamped" right medium @click="toggle"
            >add_box</v-icon
          >
          <v-icon fab v-if="expanded" right medium @click="toggle"
            >indeterminate_check_box</v-icon
          >
        </template>
      </v-clamp>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { HDFControl, ControlStatus } from "inspecjs";
//@ts-ignore
import VClamp from "vue-clamp";

interface CollapsableElement extends Element {
  offsetHeight: Number;
  offsetWidth: Number;
}

// We declare the props separately to make props types inferable.
const ControlRowColProps = Vue.extend({
  props: {
    statusCode: {
      type: String,
      required: true
    },
    result: {
      type: Object,
      required: true
    }
  }
});

@Component({
  components: {
    VClamp
  }
})
export default class ControlRowCol extends ControlRowColProps {
  expanded: boolean = false;
  clamp: boolean = false;

  get status_color(): string {
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this.statusCode.replace(" ", "")}`;
  }
}
</script>

<style lang="scss" scoped>
.mono {
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
  font-family: Consolas, Monaco, Lucida Console, Liberation Mono,
    DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
}
.right {
  margin-left: -1px;
}
</style>
