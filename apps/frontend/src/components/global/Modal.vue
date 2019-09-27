<template>
  <v-dialog :value="value" @click:outside="$emit('input', false)" width="400px">
    <slot> Default Modal </slot>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const ModalProps = Vue.extend({
  props: {
    value: Boolean // Whether or not to show
  }
});

@Component({
  components: {}
})
export default class Modal extends ModalProps {}
</script>
