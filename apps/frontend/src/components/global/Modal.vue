<template>
  <v-dialog
    :value="dialog"
    @click:outside="$emit('modal-dismissed')"
    width="300px"
  >
    <v-card>
      <v-card-title class="grey darken-2">Load files</v-card-title>
      <FileReader v-on:got-file="on_got_file" />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import FileReader from "@/components/FileReader.vue";

// We declare the props separately to make props types inferable.
const ModalProps = Vue.extend({
  props: {
    dialog: Boolean // Whether or not to show
  }
});

@Component({
  components: {
    FileReader
  }
})
export default class Modal extends ModalProps {
  on_got_file() {
    // Close ourselves, notifying main that it should maybe show sidebar
    this.$emit("file-loaded");
    this.$emit("modal-dismissed");
  }
}
</script>
