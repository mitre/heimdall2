<template>
  <v-container>
    <Modal
      :value="value"
      @input="$emit('input', $event.target.value)"
      :persistent="persistent"
    >
      <div v-if="is_logged_in" style="padding: 8px;float: right; width:100px">
        <v-btn id="logout" @click="logout()" color="normal">Logout</v-btn>
      </div>
      <v-tabs
        :vertical="$vuetify.breakpoint.mdAndUp"
        active
        :value="active_tab"
        @change="selected_tab"
        color="primary-visible"
        show-arrows
      >
        <v-tabs-slider></v-tabs-slider>
        <!-- Define our tabs -->
        <v-tab href="#uploadtab-local">Local Files</v-tab>

        <!--v-tab v-if="is_logged_in" href="#uploadtab-database">
          {{ user }} Files
        </v-tab-->

        <v-tab href="#uploadtab-s3">S3 Bucket</v-tab>

        <v-tab href="#uploadtab-splunk">Splunk</v-tab>
        <v-spacer />
        <v-divider />
        <v-tab href="#uploadtab-samples">Samples</v-tab>

        <!-- Include those components -->
        <v-tab-item value="uploadtab-local">
          <FileReader @got-files="got_files" />
        </v-tab-item>

        <!--v-tab-item value="uploadtab-database">
          <DatabaseReader @got-files="got_files" />
        </v-tab-item-->

        <v-tab-item value="uploadtab-samples">
          <SampleList @got-files="got_files" />
        </v-tab-item>

        <v-tab-item value="uploadtab-s3">
          <S3Reader @got-files="got_files" />
        </v-tab-item>

        <v-tab-item value="uploadtab-splunk">
          <SplunkReader @got-files="got_files" />
        </v-tab-item>
      </v-tabs>
      <HelpFooter />
    </Modal>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import InspecIntakeModule, { FileID } from "@/store/report_intake";
import Modal from "@/components/global/Modal.vue";
import FileReader from "@/components/global/upload_tabs/FileReader.vue";
//import DatabaseReader from "@/components/global/upload_tabs/DatabaseReader.vue";
import HelpFooter from "@/components/global/upload_tabs/HelpFooter.vue";
import S3Reader from "@/components/global/upload_tabs/aws/S3Reader.vue";
import SplunkReader from "@/components/global/upload_tabs/splunk/SplunkReader.vue";
import SampleList from "@/components/global/upload_tabs/SampleList.vue";
import ServerModule from "@/store/server";
import { LocalStorageVal } from "@/utilities/helper_util";

export class UserProfile {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  image?: string;
  phone_number?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const local_tab = new LocalStorageVal<string>("nexus_curr_tab");

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {
    value: Boolean, // Whether it is open. Modelable
    persistent: Boolean // Whether clicking outside closes
  }
});

/**
 * Multiplexes all of our file upload components
 * Emits "got-files" with a list of the unique_ids of the loaded files, wherever they come from
 */
@Component({
  components: {
    Modal,
    FileReader,
    //DatabaseReader,
    HelpFooter,
    S3Reader,
    SplunkReader,
    SampleList
  }
})
export default class UploadNexus extends Props {
  active_tab: string = ""; // Set in mounted

  // Loads the last open tab
  mounted() {
    console.log("mount UploadNexus");
    this.active_tab = local_tab.get_default("uploadtab-local");
  }

  get is_logged_in(): boolean {
    let mod = getModule(ServerModule, this.$store);

    if (mod.serverMode) {
      if (this.token) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  get token(): string {
    let mod = getModule(ServerModule, this.$store);
    return mod.token || "";
  }

  get user(): string {
    let mod = getModule(ServerModule, this.$store);
    if (mod.profile) {
      return mod.profile.email || "pending";
    } else {
      return "pending";
    }
  }

  //logout from backend
  logout() {
    console.log("logout");
    getModule(ServerModule, this.$store).clear_token();
    this.$router.push("/login");
  }
  // Handles change in tab
  selected_tab(new_tab: string) {
    this.active_tab = new_tab;
    local_tab.set(new_tab);
  }

  // Event passthrough
  got_files(files: FileID[]) {
    console.log("got_files");
    this.$emit("got-files", files);
  }
}
</script>
