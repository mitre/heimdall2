<template>
  <div class="fill-height my-3 px-1">
    <span v-if="!viewedHeader"> {{ text }} </span>
    <span v-else>
      {{ numberOfViewedControls + '/' + numberOfAllControls + ' ' + text }}
    </span>
    <v-icon
      :disabled="!allow_sort"
      class="pa-0"
      @click="toggle_sort"
    >
      {{ icon }}
    </v-icon>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

export type Sort = 'ascending' | 'descending' | 'disabled' | 'none';

@Component
export default class ColumnHeader extends Vue {
  @Prop({ required: false, type: Number }) readonly numberOfAllControls!: number;
  @Prop({ required: false, type: Number })
  readonly numberOfViewedControls!: number;

  @Prop({ required: true, type: String }) readonly sort!: Sort;

  @Prop({ required: true, type: String }) readonly text!: string;

  @Prop({ default: false, required: false, type: Boolean })
  readonly viewedHeader!: boolean;

  /**
   * Simple boolean deciding whether or not to actually show/allow sorting
   */
  get allow_sort(): boolean {
    return this.sort !== 'disabled';
  }

  /**
   * Computes the material theme getter to use for the sort icon
   */
  get icon(): string {
    switch (this.sort) {
      case 'ascending': {
        return 'mdi-sort-ascending';
      }
      case 'descending': {
        return 'mdi-sort-descending';
      }
      case 'disabled': {
        return '';
      }
      default: {
        return 'mdi-sort-variant';
      }
    }
  }

  /**
   * Callback fired upon clicking the column header.
   * Toggles between the sort modes, and emits them as an "input" event.
   */
  toggle_sort(): void {
    let newSort: string;
    newSort = this.sort === 'descending' ? 'ascending' : 'descending';
    this.$emit('input', newSort);
  }
}
</script>
