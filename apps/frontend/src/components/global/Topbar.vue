<template>
  <v-app-bar
    :clipped-left="$vuetify.breakpoint.lgAndUp"
    app
    color="blue darken-3"
    dark
  >
    <v-toolbar-title style="width: 300px" class="ml-0 pl-4">
      <v-app-bar-nav-icon
        @click.stop="$emit('toggle-drawer')"
      ></v-app-bar-nav-icon>
      <span class="hidden-sm-and-down">Heimdall Lite</span>
    </v-toolbar-title>
    <v-text-field
      flat
      solo-inverted
      hide-details
      prepend-inner-icon="search"
      label="Search"
      class="hidden-sm-and-down"
    ></v-text-field>
    <v-spacer></v-spacer>
    <v-btn icon>
      <v-icon>apps</v-icon>
    </v-btn>
    <v-btn icon>
      <v-icon>notifications</v-icon>
    </v-btn>
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
export default class Topbar extends TopbarProps {}
</script>
