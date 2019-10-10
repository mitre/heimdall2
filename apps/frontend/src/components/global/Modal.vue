<template>
  <v-dialog
    :value="value"
    :persistent="persistent"
    @click:outside="$emit('input', { target: false })"
    width="80%"
    max-width="1000px"
    content-class="v-card"
  >
    <slot> Default Modal </slot>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const ModalProps = Vue.extend({
  props: {
    value: Boolean, // Whether or not to show,
    persistent: Boolean // Whether clicking outside closes
  }
});

@Component({
  components: {}
})
export default class Modal extends ModalProps {}
</script>
