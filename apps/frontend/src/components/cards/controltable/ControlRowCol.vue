<template>
  <v-row>
    <v-col cols="12" sm="12" lg="2">
      <v-layout class="pl-2" fill-height justify-center align-center>
        <v-btn
          class="unclickable-button"
          :color="status_color"
          elevation="2"
          block
          depressed
        >
          <h3>{{ result.status.toUpperCase() }}</h3>
        </v-btn>
      </v-layout>
    </v-col>
    <v-col v-if="!result.message" cols="12" sm="12" lg="10" class="right">
      <h3 class="pa-2">Test</h3>
      <v-divider />
      <v-clamp
        class="pa-2 mono text-justify"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.code_desc.trim() }}</template>
        <template slot="after" slot-scope="{toggle, expanded, clamped}">
          <v-icon v-if="!expanded && clamped" fab right medium @click="toggle"
            >mdi-plus-box</v-icon
          >
          <v-icon v-if="expanded" fab right medium @click="toggle"
            >mdi-minus-box</v-icon
          >
        </template>
      </v-clamp>
    </v-col>
    <v-col v-else sm="6" lg="5" cols="12" class="left">
      <h3 class="pa-2">Test</h3>
      <v-divider />
      <v-clamp
        class="pa-2 mono preserve-whitespace text-justify"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.code_desc.trim() }}</template>
        <template slot="after" slot-scope="{toggle, expanded, clamped}">
          <v-icon v-if="!expanded && clamped" fab right medium @click="toggle"
            >mdi-plus-box</v-icon
          >
          <v-icon v-if="expanded" fab right medium @click="toggle"
            >mdi-minus-box</v-icon
          >
        </template>
      </v-clamp>
    </v-col>
    <v-col v-if="result.message" cols="12" sm="6" lg="5" class="left">
      <h3 class="pa-2">Result</h3>
      <v-divider />
      <v-clamp
        class="pa-2 mono preserve-whitespace text-justify"
        autoresize
        :max-lines="2"
        :expanded.sync="expanded"
      >
        <template slot="default">{{ result.message.trim() }}</template>
        <template slot="after" slot-scope="{toggle, expanded, clamped}">
          <v-icon v-if="!expanded && clamped" fab right medium @click="toggle"
            >mdi-plus-box</v-icon
          >
          <v-icon v-if="expanded" fab right medium @click="toggle"
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
import {Prop} from 'vue-property-decorator';
import {HDFControlSegment} from 'inspecjs';

interface CollapsableElement extends Element {
  offsetHeight: Number;
  offsetWidth: Number;
}

@Component({
  components: {
    VClamp
  }
})
export default class ControlRowCol extends Vue {
  @Prop({type: String, required: true}) readonly statusCode!: string;
  @Prop({type: Object, required: true}) readonly result!: HDFControlSegment;

  expanded: boolean = false;
  clamp: boolean = false;

  get status_color(): string {
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this.statusCode.replace(' ', '')}`;
  }
}
</script>

<style lang="scss" scoped>
@import '@/sass/control-row-format.scss';

button.unclickable-button {
  pointer-events: none;
}
</style>
