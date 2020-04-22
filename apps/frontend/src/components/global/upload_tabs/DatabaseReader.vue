<template>
  <v-card>
    <v-card-subtitle
      >Easily load any supported Heimdall Data Format file</v-card-subtitle
    >
    <v-container>
      <v-row>
        <v-col cols="12" align="center">
          <!-- Use inline style to emulate v-img props -->
          <img
            src="@/assets/logo-orange-tsp.svg"
            svg-inline
            style="max-width: 164px; max-height: 164px;"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" align="center">
          <div class="d-flex flex-column justify-center">
            <span :class="title_class">Heimdall</span>
            <span :class="title_class">Lite</span>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-spacer />
        <v-col align="center" cols="4">
          <!--UploadButton @files-selected="commit_files" /-->
        </v-col>
        <v-col align="right" cols="4">
          <a
            href="https://mitre.github.io/heimdall-lite-1.0/"
            target="_blank"
            class="mr-2"
          >
            Looking for 1.0?
          </a>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import AppInfoModule from "@/store/app_info";

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
  components: {}
})
export default class DatabaseReader extends Props {
  get title_class(): string[] {
    if (this.$vuetify.breakpoint.mdAndUp) {
      return ["display-4", "px-0"];
    } else {
      return ["display-2", "px-0"];
    }
  }

  get version(): string {
    return getModule(AppInfoModule, this.$store).version;
  }
}
</script>
