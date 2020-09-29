<template>
  <v-snackbar v-if="show" v-model="show" timeout="10000">
    <template v-if="error">
      <template v-if="message">ERROR: {{ message }}</template>
      <template v-else>
        ERROR: An unidentified error has occured, if functionality has degraded
        please try refreshing the page. If that does not fix the issue you are
        experiencing, then please report the issue.
      </template>
    </template>
    <template v-else>
      <template v-if="message">{{ message }}</template>
      <template v-else>The action completed successfully.</template>
    </template>

    <template v-slot:action="{attrs}">
      <v-btn
        v-if="error"
        color="red"
        text
        href="https://github.com/mitre/heimdall2/issues/new/choose"
        target="_blank"
        @click="show = false"
      >
        Report Error
      </v-btn>
      <v-btn text v-bind="attrs" @click="show = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import {SnackbarModule} from '@/store/snackbar';
import Component from 'vue-class-component';
import Vue from 'vue';

@Component({})
export default class Snackbar extends Vue {
  get show(): boolean {
    return SnackbarModule.show;
  }
  set show(visibility) {
    SnackbarModule.SET_VISIBILITY(visibility);
  }
  get error(): boolean {
    return SnackbarModule.error;
  }
  get message(): string {
    return SnackbarModule.message;
  }
}
</script>
