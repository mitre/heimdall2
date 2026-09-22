<template>
  <v-col cols="4" xs="4" md="5">
    <div style="text-align: center">
      <em v-if="showIndex">{{ index }} </em> <br />
      {{ name }} <br />
      <p v-if="startTime" style="font-size: 12px">ST: {{ startTime }}</p>
      <p style="font-size: 12px">RT: {{ runTime }}</p>
      <p v-if="lastModified" style="font-size: 12px">LM: {{ lastModified }}</p>
    </div>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';
import {Component, Prop} from 'vue-property-decorator';

@Component
export default class ProfileRow extends Vue {
  @Prop({type: String, required: true}) readonly name!: string;
  @Prop({type: String}) readonly startTime!: string;
  @Prop({type: String}) readonly runTime!: string;
  @Prop({type: String}) readonly lastModified!: string;
  @Prop({type: Number}) readonly index!: number;
  @Prop({type: Boolean, default: false}) readonly showIndex!: boolean;
}
</script>
