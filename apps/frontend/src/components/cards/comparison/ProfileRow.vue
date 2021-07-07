<template>
  <v-col cols="4" xs="4" md="5">
    <div style="text-align: center">
      <em v-if="showIndex">{{ index }} </em> <br />
      {{ name }} <br />
      <p style="font-size: 12px">{{ startTime }}</p>
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
  @Prop({type: Number}) readonly index!: number;
  @Prop({type: Boolean, default: false}) readonly showIndex!: boolean;
}
</script>
