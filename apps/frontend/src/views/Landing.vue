<template>
  <v-container>
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <UploadNexus
          v-if="is_logged_in"
          :value="dialog"
          @got-files="on_got_files"
          :persistent="true"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import UploadNexus from "@/components/global/UploadNexus.vue";
import ServerModule from "@/store/server";
import { getModule } from "vuex-module-decorators";

import { Filter } from "@/store/data_filters";
import { FileID } from "@/store/report_intake";

// We declare the props separately
// to make props types inferrable.
const LandingProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    UploadNexus
  }
})
export default class Landing extends LandingProps {
  /** Whether or not the model is showing */
  dialog: boolean = true;
  servermode: boolean = true;

  /* This is supposed to cause the dialog to automatically appear if there is
   * no file uploaded
   */
  mounted() {
    let mod = getModule(ServerModule, this.$store);
    if (mod.serverMode == undefined) {
      mod.server_mode();
    }

    if (mod.serverMode) {
      this.checkLoggedIn();
    }
  }

  get is_logged_in(): boolean {
    let mod = getModule(ServerModule, this.$store);
    if (mod.serverMode == undefined) {
      return false;
    } else if (mod.serverMode == false) {
      return true;
    } else {
      if (this.token) {
        console.log("is_logged_in - token: " + this.token + "end token");
        return true;
      } else {
        this.$router.push("/login");
        return false;
      }
    }
  }

  get token(): string {
    console.log("token");
    let mod = getModule(ServerModule, this.$store);
    return mod.token || "";
  }

  checkLoggedIn() {
    console.log("token: " + this.token + "end token");
    if (!this.token) {
      console.log("Go to auth");
      //  this.dialog = false;
      this.$router.push("/login");
    } else {
      this.$router.push("/profile");
    }
  }

  /**
   * Invoked when file(s) are loaded.
   */
  on_got_files(ids: FileID[]) {
    console.log("on_got_files");
    // Close the dialog
    this.dialog = false;

    // If just one file, focus it
    if (ids.length === 1) {
      console.log("one file: " + ids[0]);
      this.$router.push(`/results/${ids[0]}`);
    }

    // If more than one, focus all.
    // TODO: Provide support for focusing a subset of files
    else if (ids.length > 1) {
      this.$router.push(`/results/all`);
    }
  }
}
</script>
