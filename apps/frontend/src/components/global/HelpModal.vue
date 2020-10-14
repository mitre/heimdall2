<template>
  <v-dialog v-model="dialog" width="75%">
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on}">
      <slot name="clickable" :on="on" />
    </template>

    <v-card>
      <v-card-title class="headline grey" primary-title
        >How to use Heimdall Lite {{ version }}</v-card-title
      >

      <v-card-text>
        <br />

        <h2>
          View the results of an
          <a href="htps://www.inspec.io">InSpec</a> profile execution (using
          InSpec's JSON reporter) or the results from
          <a href="https://github.com/mitre/heimdall_tools">Heimdall Tools</a>
          which converts many Static and Dynamic scanning tools Results to a
          Heimdall Data Format JSON file.
        </h2>
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
        <h2>
          Use the treemap to navigate through your controls by NIST family
          classification.
        </h2>
        <br />
        <v-img src="../../assets/treemap.png" />
        <br />
        <hr />
        <br />
        <h2>Use the data table to sort your controls and see more details.</h2>
        <br />
        <v-img src="../../assets/data_table.png" />
        <br />
        <hr />
        <br />
        <h2>
          Click on a control to detect which tests passed or failed, or see its
          details and code.
        </h2>
        <br />
        <v-img src="../../assets/control_data.png" />
        <br />
        <hr />
        <br />
      </v-card-text>

      <v-divider />

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
}
</script>
