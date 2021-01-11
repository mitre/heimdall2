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
    <v-col
      cols="12"
      :sm="result.message ? 6 : 12"
      :lg="result.message ? 5 : 10"
      :class="result.message ? 'left' : 'right'"
    >
      <h3 class="pa-2">Test</h3>
      <v-divider />
      <!-- HTML is sanitized with sanitize-html -->
      <!-- eslint-disable vue/no-v-html -->
      <pre
        class="pa-2 mono text-justify"
        v-html="sanitize_html(result.code_desc.trim())"
      />
      <!-- eslint-enable vue/no-v-html -->
    </v-col>
    <v-col v-if="result.message" cols="12" sm="6" lg="5" class="left">
      <h3 class="pa-2">Result</h3>
      <v-divider />
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="pa-2 mono text-justify"
        v-html="sanitize_html(result.message.trim())"
      />
      <!-- eslint-enable vue/no-v-html -->
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {HDFControlSegment} from 'inspecjs';
import HtmlSanitizeMixin from '@/mixins/HtmlSanitizeMixin';

interface CollapsableElement extends Element {
  offsetHeight: Number;
  offsetWidth: Number;
}

@Component({})
export default class ControlRowCol extends mixins(HtmlSanitizeMixin) {
  @Prop({type: String, required: true}) readonly statusCode!: string;
  @Prop({type: Object, required: true}) readonly result!: HDFControlSegment;

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
