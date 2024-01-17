<template>
  <div v-if="show" class="spin">
    <div class="ring" style="font-size: 160%">
      <v-progress-circular
        :rotate="360"
        :size="200"
        :width="15"
        :value="value"
        color="light-blue"
      >
        <template #default
          ><b>{{ value }} %</b></template
        >
      </v-progress-circular>
    </div>
    <div v-if="message.length > 0" class="ring" style="top: 65%">
      <b>{{ message }}</b>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {SpinnerModule} from '@/store/spinner';

@Component
export default class Spinner extends Vue {
  get show(): boolean {
    return SpinnerModule.show;
  }

  get message(): string {
    return SpinnerModule.message;
  }

  get value(): number {
    return SpinnerModule.value;
  }
}
</script>

<style lang="scss" scoped>
.spin {
  z-index: 999;
  width: 100%;
  height: 100%;
  background-color: rgba($color: #585252, $alpha: 0.8);
  position: fixed;
}
.ring {
  position: fixed;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  font-weight: bold;
  font-size: medium;
  color: #409ae9;
}
</style>
