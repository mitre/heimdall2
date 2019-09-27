<template>
  <v-app-bar :clipped-left="$vuetify.breakpoint.lgAndUp" color="background" app>
    <!-- The title and nav bar -->
    <v-toolbar-title class="ml-0 pl-4">
      <v-app-bar-nav-icon
        @click.stop="$emit('toggle-drawer')"
      ></v-app-bar-nav-icon>
      <span class="hidden-sm-and-down">Heimdall Lite</span>
    </v-toolbar-title>
    <v-spacer />

    <!-- Our customizable content -->
    <slot></slot>

    <!-- Login information or whatever -->
    <v-btn icon large>
      <v-avatar size="32px" item>
        <v-img :src="require('@/assets/logo.png')" alt="Heimdall"></v-img>
      </v-avatar>
    </v-btn>
  </v-app-bar>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const TopbarProps = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class Topbar extends TopbarProps {
  /** Submits an event to clear all filters */
  clear(): void {
    this.$emit("clear");
  }
}
</script>
