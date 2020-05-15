<template>
  <v-container>
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <UploadNexus
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

  /* This is supposed to cause the dialog to automatically appear if there is
   * no file uploaded
   */
  mounted() {
    this.checkLoggedIn();
  }

  get is_logged_in(): boolean {
    if (this.checkLoggedIn()) {
      console.log("is_logged_in - token: " + this.token + "end token");
      return true;
    } else {
      return false;
    }
  }

  get token(): string {
    let mod = getModule(ServerModule, this.$store);
    return mod.token || "";
  }

  checkLoggedIn() {
    //let server = getModule(ServerModule, this.$store);
    if (this.token) {
      //console.log("profile: " + JSON.stringify(server.profile));
      return true;
    } else {
      console.log("Go to login");
      this.dialog = false;
      // this.$router.push("/login");
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
