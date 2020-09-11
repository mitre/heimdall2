<template>
  <v-list-item :to="link" @click="$emit('click', $event)">
    <v-list-item-avatar>
      <v-icon small v-text="icon" />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>{{ text }}</v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<style scoped>
.v-avatar {
  height: 0px !important;
  min-width: 30px !important;
  width: 0px !important;
}
</style>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

// We declare the props separately to make props types inferable.
const LinkItemProps = Vue.extend({
  props: {
    text: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: false
    },
    link: {
      type: String,
      required: false
    },
    action: {
      type: Object, // Of type linkaction
      required: false
    }
  }
});

/** If provided, will be called whenever clicked. */
export interface LinkAction {
  callback: () => void;
}

@Component({
  components: {}
})
export default class LinkItem extends LinkItemProps {}
</script>
