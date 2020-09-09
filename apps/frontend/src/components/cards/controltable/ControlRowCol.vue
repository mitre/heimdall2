<template>
  <v-row>
    <v-col cols="12" sm="12" lg="2">
      <v-layout class="pl-2" fill-height justify-center align-center>
        <v-btn class="unclickable-button" :color="status_color" block depressed>
          <h3>{{ result.status.toUpperCase() }}</h3>
        </v-btn>
      </v-layout>
    </v-col>
    <v-col v-if="!result.message" cols="12" sm="12" lg="10" class="right">
      <h3 class="pa-2">Test</h3>
      <v-divider></v-divider>
      <v-clamp
        class="pa-2 mono text-justify"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.code_desc.trim() }}</template>
        <template slot="after" slot-scope="{toggle, expanded, clamped}">
          <v-icon fab v-if="!expanded && clamped" right medium @click="toggle"
            >mdi-plus-box</v-icon
          >
          <v-icon fab v-if="expanded" right medium @click="toggle"
            >mdi-minus-box</v-icon
          >
        </template>
      </v-clamp>
    </v-col>
    <v-col v-else sm="6" lg="5" cols="12" class="left">
      <h3 class="pa-2">Test</h3>
      <v-divider></v-divider>
      <v-clamp
        class="pa-2 mono preserve-whitespace text-justify"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.code_desc.trim() }}</template>
        <template slot="after" slot-scope="{toggle, expanded, clamped}">
          <v-icon fab v-if="!expanded && clamped" right medium @click="toggle"
            >mdi-plus-box</v-icon
          >
          <v-icon fab v-if="expanded" right medium @click="toggle"
            >mdi-minus-box</v-icon
          >
        </template>
      </v-clamp>
    </v-col>
    <v-col v-if="result.message" cols="12" sm="6" lg="5" class="left">
      <h3 class="pa-2">Result</h3>
      <v-divider></v-divider>
      <v-clamp
        class="pa-2 mono preserve-whitespace text-justify"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.message.trim() }}</template>
        <template slot="after" slot-scope="{toggle, expanded, clamped}">
          <v-icon fab v-if="!expanded && clamped" right medium @click="toggle"
            >mdi-plus-box</v-icon
          >
          <v-icon fab v-if="expanded" right medium @click="toggle"
            >mdi-minus-box</v-icon
          >
        </template>
      </v-clamp>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

//@ts-ignore
import VClamp from 'vue-clamp/dist/vue-clamp.js';

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
    return `status${this.statusCode.replace(' ', '')}`;
  }
}
</script>

<style lang="scss" scoped>
button.unclickable-button {
  pointer-events: none;
}
</style>
