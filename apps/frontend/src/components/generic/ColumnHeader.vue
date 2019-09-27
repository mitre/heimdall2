<template>
  <div class="fill-height px-2">
    <span> {{ text }} </span>
    <!-- Note: always have button for spacing consistency. Just disable and invis -->
    <v-btn :disabled="!allow_sort" text icon @click="toggle_sort">
      <v-icon class="pa-0"> {{ icon }} </v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

export type Sort = "ascending" | "descending" | "none" | "disabled";

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {
    text: {
      type: String,
      required: true
    },
    sort: {
      type: String, // Of type Sort
      required: true
    }
  }
});

@Component
export default class ColumnHeader extends Props {
  /**
   * Simple boolean deciding whether or not to actually show/allow sorting
   */
  get allow_sort(): boolean {
    // return true;
    return this.sort !== "disabled";
  }

  /**
   * Callback fired upon clicking the column header.
   * Toggles between the sort modes, and emits them as an "input" event.
   */
  toggle_sort(): void {
    let new_sort: string;
    switch (this.sort as Sort) {
      default: // Shouldn't happen but whatever
      case "none":
        new_sort = "descending";
        break;
      case "descending":
        new_sort = "ascending";
        break;
      case "ascending":
        new_sort = "descending";
        break;
    }
    this.$emit("input", new_sort);
  }

  /**
   * Computes the material theme getter to use for the sort icon
   */
  get icon(): string {
    switch (this.sort as Sort) {
      default:
      case "none":
        return "sort";
      case "ascending":
        return "arrow_upward";
      case "descending":
        return "arrow_downward";
      case "disabled":
        return "";
    }
  }
}
</script>
