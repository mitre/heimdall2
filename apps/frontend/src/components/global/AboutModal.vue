<template>
  <v-dialog v-model="dialog" width="75%">
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template v-slot:activator="{on}">
      <slot name="clickable" v-bind:on="on"> </slot>
    </template>
    <v-card>
      <v-card-title class="headline grey" primary-title>
        About Heimdall Lite
      </v-card-title>

      <v-card-text>
        <p>
          <br />
          <span class="title">
            {{ version }}
          </span>
          <br />
          <br />
          <span class="subtitle-2">
            <strong>Changelog:</strong>
            <a :href="'' + repository + branch + changelog + ''">
              {{ repository }}{{ branch }}{{ changelog }}
            </a>
          </span>
          <br />
          <span class="subtitle-2">
            <strong>Github:</strong>
            <a :href="'' + repository + ''">
              {{ repository }}
            </a>
          </span>
          <br />
          <span class="subtitle-2">
            <br />
            If you would like to report an Issue or Feature Request,
            <a :href="'' + repository + issues + ''">
              let us know on github.
            </a>
          </span>
        </p>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-btn color="primary" text @click="dialog = false">Close Window</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import {AppInfoModule} from '@/store/app_info';

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});
@Component({
  components: {}
})
export default class HelpModal extends Props {
  dialog: boolean = false;
  get version(): string {
    return AppInfoModule.version;
  }
  get changelog(): string {
    return AppInfoModule.changelog;
  }
  get repository(): string {
    return AppInfoModule.repository;
  }
  get branch(): string {
    return AppInfoModule.branch;
  }
  get issues(): string {
    return AppInfoModule.issues;
  }
  get passedClickable(): boolean | undefined {
    return this.$slots.clickable ? true : false;
  }
}
</script>
