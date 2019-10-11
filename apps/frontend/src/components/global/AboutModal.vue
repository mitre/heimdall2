<template>
  <v-dialog v-model="dialog" width="75%">
    <template v-slot:activator="{ on }">
      <LinkItem key="about" text="About" icon="info" v-on="on" />
    </template>
    <v-card>
      <v-card-title class="headline grey" primary-title>
        About Heimdall Lite
      </v-card-title>

      <v-card-text>
        <p>
          <br />
          <span class="title">
            <strong>Version:</strong>
            {{ version }}
          </span>
          <br />
          <br />
          <span class="subtitle-2">
            <strong>Github:</strong>
            <a href="https://github.com/mitre/heimdall-vuetify">
              https://github.com/mitre/heimdall-vuetify
            </a>
          </span>
          <br />
          <span class="subtitle-2">
            <br />
            If you would like to report an Issue or Feature Request,
            <a href="https://github.com/mitre/heimdall-vuetify/issues/new">
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
import Vue from "vue";
import Component from "vue-class-component";

import LinkItem from "@/components/global/sidebaritems/SidebarLink.vue";

import { getModule } from "vuex-module-decorators";
import AppInfoModule from "@/store/app_info";

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});
@Component({
  components: {
    LinkItem
  }
})
export default class HelpModal extends Props {
  dialog: boolean = false;
  get version(): string {
    return getModule(AppInfoModule, this.$store).version;
  }
}
</script>
