<template>
  <v-snackbar v-if="show" id="info-snackbar" v-model="show" timeout="10000" top>
    {{ message }}

    <template #action="{attrs}">
      <v-btn id="hide-snackbar" text v-bind="attrs" @click="show = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import {SnackbarModule} from '@/store/snackbar';
import Component from 'vue-class-component';
import Vue from 'vue';

@Component
export default class Snackbar extends Vue {
  messageContent: string = '';

  get show(): boolean {
    return SnackbarModule.show;
  }

  set show(visibility) {
    SnackbarModule.visibility(visibility);
  }

  get error(): boolean {
    return SnackbarModule.error;
  }

  get message(): string {
    this.messageContent = SnackbarModule.message;
    if (this.error) {
      if (this.messageContent) {
        return this.messageContent;
      } else {
        return 'ERROR: An unidentified error has occured, if functionality has degraded please try refreshing the page. If that does not fix the issue you are experiencing, then please report the issue.';
      }
    } else {
      if (this.messageContent) {
        return this.messageContent;
      } else {
        return 'The action completed successfully.';
      }
    }
  }
}
</script>
