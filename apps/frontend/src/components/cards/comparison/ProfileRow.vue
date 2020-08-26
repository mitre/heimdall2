<template>
  <v-col cols="4" xs="4" md="5">
    <div style="text-align:center;">
      <i v-if="show_index">{{ index }} </i> <br />
      {{ name }} <br />
      <p style="font-size: 12px;">{{ start_time }}</p>
    </div>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';
const Props = Vue.extend({
  props: {
    name: String,
    start_time: String,
    index: Number,
    show_index: Boolean
  }
});

export default class DeltaView extends Props {}
</script>
