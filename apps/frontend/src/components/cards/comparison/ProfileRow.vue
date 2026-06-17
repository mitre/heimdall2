<template>
  <v-col
    cols="4"
    xs="4"
    md="5"
  >
    <div style="text-align: center">
      <em v-if="showIndex">{{ index }} </em> <br>
      {{ name }} <br>
      <p style="font-size: 12px">
        {{ startTime }}
      </p>
    </div>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class ProfileRow extends Vue {
  @Prop({ type: Number }) readonly index!: number;
  @Prop({ required: true, type: String }) readonly name!: string;
  @Prop({ default: false, type: Boolean }) readonly showIndex!: boolean;
  @Prop({ type: String }) readonly startTime!: string;
}
</script>
