<template>
  <div v-if="classification" class="footer">{{ classification }}</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {ServerModule} from '../../store/server';

@Component({})
export default class ClassificationFooter extends Vue {
  get classification(): string {
    return ServerModule.classificationLevel;
  }
}
</script>

<style scoped>
.footer {
  background: red;
  position: fixed;
  text-align: center;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4em;
}
</style>
