<template>
  <v-row no-gutters>
    <v-col class="pa-0" :cols="6">
      <v-card tile flat class="d-flex flex-column fill-height">
        <slot name="status" />
        <v-divider />
        <slot name="severity" />
        <v-divider />
        <slot name="tags" />
      </v-card>
    </v-col>

    <v-col class="pa-0" :cols="6">
      <v-card tile flat class="d-flex flex-column fill-height">
        <slot name="id" />
        <v-divider />
        <slot name="title" />
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

const Props = Vue.extend({
  props: {
    statusColor: String
  }
});
@Component
export default class Row extends Props {}
</script>

<style scoped>
.v-card {
  background-color: rgba(0, 0, 0, 0);
}
</style>
