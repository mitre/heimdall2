<template>
  <v-card>
    <v-container class="bar lighten-2">
      <v-row justify="space-around">
        <AboutModal>
          <template v-slot:clickable="{ on }">
            <v-chip v-on="on">
              <v-icon small>mdi-information</v-icon>
              <span class="d-none d-sm-inline pl-3">
                About
              </span>
            </v-chip>
          </template>
        </AboutModal>
        <HelpModal>
          <template v-slot:clickable="{ on }">
            <v-chip v-on="on">
              <v-icon small>mdi-help-circle</v-icon>
              <span class="d-none d-sm-inline pl-3">
                Help
              </span>
            </v-chip>
          </template>
        </HelpModal>
        <v-chip href="https://github.com/mitre/heimdall-vuetify">
          <v-icon small>mdi-github-circle</v-icon>
          <span class="d-none d-sm-inline pl-3">
            Github
          </span>
        </v-chip>
        <v-chip href="https://github.com/mitre/heimdall-vuetify">
          <v-icon small>mdi-library-books</v-icon>
          <span class="d-none d-sm-inline pl-3">
            Documentation
          </span>
        </v-chip>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import HelpModal from "@/components/global/HelpModal.vue";
import AboutModal from "@/components/global/AboutModal.vue";
// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});
/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {
    AboutModal,
    HelpModal
  }
})
export default class HelpFooter extends Props {}
</script>
