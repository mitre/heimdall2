<template>
  <v-snackbar
    v-if="show"
    id="info-snackbar"
    v-model="show"
    :color="error ? 'error' : warning ? 'warning' : 'success'"
    elevation="24"
    timeout="10000"
    top
  >
    {{ message }}

    <div>
        <a :href="'' + href"> {{ hrefText }} </a>
    </div>
  
    <template #action="{attrs}">
      <v-btn id="hide-snackbar" text v-bind="attrs" @click="show = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import {SnackbarModule} from '@/store/snackbar';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component
export default class Snackbar extends Vue {

  messageContent = '';
  // href = SnackbarModule.linkUrl;
  // hrefText = SnackbarModule.linkText;  


  get show(): boolean {
    return SnackbarModule.show;
  }

  set show(visibility) {
    SnackbarModule.visibility(visibility);
  }

  get error(): boolean {
    return SnackbarModule.error;
  }

  get warning(): boolean {
    return SnackbarModule.warn;
  }

  get message(): string {
    this.messageContent = SnackbarModule.message;
    if (this.error) {
      if (this.messageContent) {
        return this.messageContent;
      } else {
        return 'ERROR: An unidentified error has occurred, if functionality has degraded please try refreshing the page. If that does not fix the issue you are experiencing, then please report the issue.';
      }
    } else {
      if (this.messageContent) {
        return this.messageContent;
      } else {
        return 'The action completed successfully.';
      }
    }
  }

  get href(): string {
    console.log(`SnackbarModule.linkUrl is: ${SnackbarModule.linkUrl}`)
    return SnackbarModule.linkUrl;
  }

  get hrefText(): string {
    console.log(`SnackbarModule.linkText is: ${SnackbarModule.linkText}`)
    return SnackbarModule.linkText;
  }
}
</script>
