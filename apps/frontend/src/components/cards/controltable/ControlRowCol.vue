<template>
  <v-row dense>
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
      class="py-0"
      cols="12"
      :sm="resultMessage ? 6 : 12"
      :lg="resultMessage ? 5 : 10"
      :class="resultMessage ? 'left' : 'right'"
    >
      <h3 class="pa-2">Test</h3>
      <v-divider />
      <!-- HTML is sanitized with sanitize-html -->
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="pa-2 mono pre-formatted"
        v-html="sanitize_html(result.code_desc.trim())"
      />
      <!-- eslint-enable vue/no-v-html -->
    </v-col>
    <v-col v-if="resultMessage" cols="12" sm="6" lg="5" class="left">
      <h3 class="pa-2">Result</h3>
      <v-divider />
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="pa-2 mono pre-formatted"
        v-html="sanitize_html(resultMessage.trim())"
      />
      <!-- eslint-enable vue/no-v-html -->
    </v-col>
    <v-col v-if="result['backtrace'] !== undefined" cols="12" class="pa-2">
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header>Backtrace</v-expansion-panel-header>
          <v-expansion-panel-content>
            <span
              v-for="(trace, i) in result.backtrace"
              :key="i"
              class="inline-text"
            >
              {{ trace }}
            </span>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import HtmlSanitizeMixin from '@/mixins/HtmlSanitizeMixin';
import {HDFControlSegment} from 'inspecjs';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({})
export default class ControlRowCol extends mixins(HtmlSanitizeMixin) {
  @Prop({type: String, required: true}) readonly statusCode!: string;
  @Prop({type: Object, required: true}) readonly result!: HDFControlSegment;

  get status_color(): string {
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this.statusCode.replace(' ', '')}`;
  }

  get resultMessage(): string | undefined {
    // Check if either `skip_message` or `message` exist
    // If one but not the other exists, display the individual message
    // Otherwise display both messages in a joint string
    return this.result.skip_message
      ? this.result.message
        ? `-Message-\n${this.result.message}\n\n-Skip Message-\n${this.result.skip_message}`
        : this.result.skip_message
      : this.result.message;
  }
}
</script>

<style lang="scss" scoped>
@import '@/sass/control-row-format.scss';

button.unclickable-button {
  pointer-events: none;
}

.pre-formatted {
  white-space: pre-wrap;
}

.inline-text {
  display: inline-block;
}
</style>
