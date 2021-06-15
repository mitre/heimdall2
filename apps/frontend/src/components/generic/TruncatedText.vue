<template>
  <v-tooltip bottom>
    <template #activator="{on}">
      <span
        ref="text"
        :style="spanStyle"
        :class="['overflow'] + spanClass"
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
  const currOverflow: string | null = el.style.overflow;

  // Change to disallow overflow to see if it's happening
  if (currOverflow === null || currOverflow === 'visible') {
    el.style.overflow = 'hidden';
  }

  // Determine if overflowing by widths/heights
  const innerWidth = parseInt(window.getComputedStyle(el).width || '0');
  const isOverflowing = innerWidth < el.scrollWidth;

  // Put back the old overflow
  el.style.overflow = currOverflow;

  return isOverflowing;
}

@Component
export default class TruncatedText extends Vue {
  @Prop({type: String, required: true}) readonly text!: string;
  @Prop({type: Array, default: () => []}) readonly spanClass!: string[];
  @Prop({type: String, default: ''}) readonly spanStyle!: string;

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
