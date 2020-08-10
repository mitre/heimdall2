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
import Vue from 'vue';
import Component from 'vue-class-component';
import UploadNexus from '@/components/global/UploadNexus.vue';
import ServerModule from '@/store/server';
import {getModule} from 'vuex-module-decorators';

import FilteredDataModule, {Filter} from '@/store/data_filters';
import {FileID} from '@/store/report_intake';

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
        console.log('is_logged_in - token: ' + this.token + 'end token');
        return true;
      } else {
        this.$router.push('/login');
        return false;
      }
    }
  }

  get token(): string {
    console.log('token');
    let mod = getModule(ServerModule, this.$store);
    return mod.token || '';
  }

  checkLoggedIn() {
    console.log('token: ' + this.token + 'end token');
    if (!this.token) {
      console.log('Go to auth');
      //  this.dialog = false;
      this.$router.push('/login');
    } else {
      this.$router.push('/profile');
    }
  }

  /**
   * Invoked when file(s) are loaded.
   */
  on_got_files(ids: FileID[]) {
    console.log('on_got_files');
    // Close the dialog
    this.dialog = false;

    //enable all uploaded files
    let filter_module = getModule(FilteredDataModule, this.$store);
    for (let i of ids) {
      filter_module.set_toggle_file_on(i);
    }
    this.$router.push(`/results`);
  }
}
</script>
