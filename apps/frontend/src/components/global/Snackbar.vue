<template>
  <v-snackbar
    v-if="show"
    id="info-snackbar"
    v-model="show"
    :color="error ? 'error' : 'success'"
    elevation="24"
    timeout="10000"
    top
  >
    {{ message }}

    <template #action="{attrs}">
      <v-btn
        id="hide-snackbar"
        text
        v-bind="attrs"
        @click="show = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { SnackbarModule } from '@/store/snackbar';

@Component
export default class Snackbar extends Vue {
  messageContent = '';

  get error(): boolean {
    return SnackbarModule.error;
  }

  get message(): string {
    this.messageContent = SnackbarModule.message;
    if (this.error) {
      return this.messageContent ? this.messageContent : 'ERROR: An unidentified error has occurred, if functionality is degraded please try refreshing the page. If that does not fix the issue you are experiencing, then please report the issue.';
    } else {
      return this.messageContent ? this.messageContent : 'The action completed successfully.';
    }
  }

  get show(): boolean {
    return SnackbarModule.show;
  }

  set show(visibility) {
    SnackbarModule.visibility(visibility);
  }
}
</script>
