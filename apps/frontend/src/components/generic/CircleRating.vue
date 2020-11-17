<template>
  <div>
    <v-icon v-for="i in filledCount" :key="'filledCircle' + i" small
      >mdi-checkbox-blank-circle</v-icon
    >
    <v-icon v-for="i in totalCount - filledCount" :key="'emptyCircle' + i" small
      >mdi-checkbox-blank-circle-outline</v-icon
    >
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import Vue from 'vue';

@Component({})
export default class CircleRating extends Vue {
    @Prop({type: Number, default: false}) readonly filledCount!: number;
    @Prop({type: Number, default: false}) readonly totalCount!: number;
}
</script>
