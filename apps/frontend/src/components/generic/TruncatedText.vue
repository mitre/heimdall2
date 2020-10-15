<template>
  <v-tooltip bottom>
    <template #activator="{on}">
      <span
        ref="text"
        :style="span_style"
        :class="['overflow'] + span_class"
        v-on="on"
      >
        {{ text }}
      </span>
    </template>
    <span v-if="is_truncated"> {{ text }} </span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

// https://stackoverflow.com/questions/143815/determine-if-an-html-elements-content-overflows
// Determines if the passed element is overflowing its bounds,
// either vertically or horizontally.
// Will temporarily modify the "overflow" style to detect this
// if necessary.
function check_overflow(el: HTMLElement): boolean {
  // Get the current overflow
  let curr_overflow: string | null = el.style.overflow;

  // Change to disallow overflow to see if it's happening
  if (curr_overflow === null || curr_overflow === 'visible') {
    el.style.overflow = 'hidden';
  }

  // Determine if overflowing by widths/heights
  let inner_width = parseInt(window.getComputedStyle(el).width || '0');
  let is_overflowing = inner_width < el.scrollWidth;

  // Put back the old overflow
  el.style.overflow = curr_overflow;

  return is_overflowing;
}

@Component
export default class TruncatedText extends Vue {
  @Prop({type: String, required: true}) readonly text!: string;
  @Prop({type: Array, default: () => []}) readonly span_class!: string[];
  @Prop({type: String, default: ''}) readonly span_style!: string;

  get is_truncated(): boolean {
    if (this.$refs['text'] !== undefined) {
      return check_overflow(this.$refs['text'] as HTMLElement);
    } else {
      return false;
    }
  }
}
</script>

<style scoped>
.overflow {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: normal;
}
</style>
