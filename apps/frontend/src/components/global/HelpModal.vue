<template>
  <v-dialog v-model="dialog" width="75%">
    <template v-slot:activator="{ on }">
      <LinkItem key="help" text="Help" icon="info" v-on="on"></LinkItem>
    </template>

    <v-card>
      <v-card-title class="headline grey" primary-title>
        How to use Heimdall Lite {{ version }}
      </v-card-title>

      <v-card-text>
        <br />
        <h1>View the results of an InSpec execution json</h1>
        <br />
        <p>
          Easily see how many controls passed and failed.
          <br />
          <br />Click on the donut charts to filter the controls by status and
          severity.
        </p>
        <v-img src="../../assets/data_cards.png" />
        <br />
        <hr />
        <br />
        <h1>
          Use the treemap to navigate through your controls by NIST family
          classification.
        </h1>
        <br />
        <v-img src="../../assets/treemap.png" />
        <br />
        <hr />
        <br />
        <h1>
          Use the data table to sort your controls and see more details.
        </h1>
        <br />
        <v-img src="../../assets/data_table.png" />
        <br />
        <hr />
        <br />
        <h1>
          Click on a control to detect which tests passed or failed, or see its
          details and code.
        </h1>
        <br />
        <v-img src="../../assets/control_data.png" />
        <br />
        <hr />
        <br />
        <h1 class="text-center">
          View the profile before you execute it on a system.
        </h1>
        <br />
        <p>
          The profile must be loaded into Heimdall Lite as a json value.
          <br />To create a json of a profile use the following steps:
        </p>
        <li>
          Open a terminal to the directory of the profile.
        </li>
        <li>
          Run the command: `inspec json [path to profile] -o [name]`
        </li>
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
