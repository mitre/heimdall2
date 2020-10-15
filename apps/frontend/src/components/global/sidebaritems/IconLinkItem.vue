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

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component
export default class LinkItem extends Vue {
  @Prop({type: String, required: true}) readonly text!: string;
  @Prop({type: String}) readonly icon!: string;
  @Prop({type: String}) readonly link!: string;
}
</script>
