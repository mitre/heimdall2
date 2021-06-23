<template>
  <div class="fill-height my-3 px-1">
    <span v-if="!viewedHeader"> {{ text }} </span>
    <span v-else>
      {{ numberOfViewedControls + '/' + numberOfAllControls + ' ' + text }}
    </span>
    <v-icon class="pa-0"> {{ icon }} </v-icon>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

export type Sort = 'ascending' | 'descending' | 'none' | 'disabled';

@Component
export default class ColumnHeader extends Vue {
  @Prop({type: String, required: true}) readonly text!: string;
  @Prop({type: String, required: true}) readonly sort!: Sort;
  @Prop({type: Boolean, required: false, default: false}) readonly viewedHeader!: Sort;
  @Prop({type: Number, required: false}) readonly numberOfViewedControls!: number;
  @Prop({type: Number, required: false}) readonly numberOfAllControls!: number;
  /**
   * Simple boolean deciding whether or not to actually show/allow sorting
   */
  get allow_sort(): boolean {
    return this.sort !== 'disabled';
  }

  /**
   * Callback fired upon clicking the column header.
   * Toggles between the sort modes, and emits them as an "input" event.
   */
  toggle_sort(): void {
    let newSort: string;
    if (this.sort === 'descending') {
      newSort = 'ascending';
    } else {
      newSort = 'descending';
    }
    this.$emit('input', newSort);
  }

  /**
   * Computes the material theme getter to use for the sort icon
   */
  get icon(): string {
    switch (this.sort) {
      case 'ascending':
        return 'mdi-sort-ascending';
      case 'descending':
        return 'mdi-sort-descending';
      case 'disabled':
        return '';
      default:
        return 'mdi-sort-variant';
    }
  }
}
</script>
