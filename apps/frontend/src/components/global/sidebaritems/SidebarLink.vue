<template>
  <v-list-item :to="link" @click="$emit('click', $event)">
    <v-list-item-avatar>
      <v-icon v-text="icon" small />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>{{ text }}</v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

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
    }
  }
});

@Component({
  components: {}
})
export default class LinkItem extends LinkItemProps {}
</script>
