<template>
  <v-tooltip :value="errors.length" top :open-on-hover="false">
    <template #activator="data">
      <slot v-on="data.on" />
    </template>
    <ul>
      <li><strong>Errors encountered:</strong></li>
      <li v-for="item in errors" :key="item.key" v-text="item.text" />
    </ul>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

interface ErrorItem {
  key: number;
  text: string;
}

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class ErrorTooltip extends Props {
  /** What error is currently shown, if any. Shared between stages. */
  errors: ErrorItem[] = [];

  /** Need this for proper key resolution */
  counter: number = 0;

  /** Callback to show errors */
  show_error(message: string): void {
    // Increment counter
    this.counter += 1;

    // Add the error, but clear it after X seconds
    this.errors.push({
      text: message,
      key: this.counter
    });
    setTimeout(() => this.errors.shift(), 12000);
  }
}
</script>
