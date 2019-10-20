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
      lg="9"
      xl="9"
      cols="10"
      sm="10"
      md="10"
      class="right"
    >
      <h3>Test</h3>
      <v-divider></v-divider>
      <pre v-show="expanded">{{ result.code_desc }}</pre>
      <pre v-show="!expanded" ref="message" v-line-clamp="2">{{
        result.code_desc
      }}</pre>
    </v-col>
    <v-col v-else lg="4" xl="4" sm="6" md="6" xs="6" class="right">
      <h3>Test</h3>
      <v-divider></v-divider>
      <pre v-show="expanded">{{ result.code_desc }}</pre>
      <pre v-show="!expanded" ref="message" v-line-clamp="2">{{
        result.code_desc
      }}</pre>
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
      <h3>Result</h3>
      <v-divider></v-divider>
      <pre v-show="expanded">{{ result.message.trim() }}</pre>
      <pre v-show="!expanded" v-line-clamp="2" :ref="'code'">{{
        result.message.trim()
      }}</pre>
    </v-col>
    <v-col
      v-if="clamp"
      cols="12"
      sm="12"
      md="12"
      lg="2"
      xl="2"
      @click="expanded = !expanded"
    >
      <div v-if="!expanded">
        <h3>Expand</h3>
        <v-divider></v-divider>
        <v-icon>mdi-arrow-expand</v-icon>
      </div>
      <div v-else>
        <h3>Collapse</h3>
        <v-divider></v-divider>
        <v-icon>mdi-arrow-collapse</v-icon>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { HDFControl, ControlStatus } from "inspecjs";

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
  components: {}
})
export default class ControlRowCol extends ControlRowColProps {
  expanded: boolean = false;
  clamp: boolean = false;

  get status_color(): string {
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this.statusCode.replace(" ", "")}`;
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
      that.clamp =
        this.isClamped(this.$refs.message as CollapsableElement) ||
        this.isClamped(this.$refs.code as CollapsableElement);
    });
  }
}
</script>

<style lang="scss" scoped>
pre {
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}
.right {
  margin-left: -1px;
}
</style>
