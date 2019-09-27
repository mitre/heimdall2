<template>
  <BaseView>
    <!-- Topbar config - give it a search bar -->
    <template #topbar-content>
      Topbar stuff
    </template>

    <!-- The main content: comparisons of each set of controls in control_sets, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pa-2>
        <CompareRow
          v-for="(control_set, i) in control_sets"
          :controls="control_set"
          class="my-4"
          :key="i"
        />
      </v-container>
    </template>

    <!-- File select modal toggle -->
    <v-btn
      bottom
      color="teal"
      dark
      fab
      fixed
      right
      @click="dialog = !dialog"
      :hidden="dialog"
    >
      <v-icon>add</v-icon>
    </v-btn>

    <!-- File select modal -->
    <Modal v-model="dialog">
      <v-card>
        <v-card-title class="grey darken-2">Load files</v-card-title>
        <FileReader @got-file="dialog = false" />
      </v-card>
    </Modal>
  </BaseView>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import BaseView from "@/views/BaseView.vue";
import Modal from "@/components/global/Modal.vue";
import FileReader from "@/components/global/FileReader.vue";

import CompareRow from "@/components/cards/comparison/CompareRow.vue";

import { Filter, NistMapState } from "@/store/data_filters";
import { ControlStatus, Severity } from "inspecjs";
import { FileID } from "@/store/report_intake";
import { ComparisonContext } from "../utilities/delta_util";
import { getModule } from "vuex-module-decorators";
import InspecDataModule, { ContextualizedControl } from "../store/data_store";

// We declare the props separately
// to make props types inferrable.
const Props = Vue.extend({
  props: {}
});

@Component({
  components: {
    BaseView,
    Modal,
    FileReader,
    CompareRow
  }
})
export default class Compare extends Props {
  /** Whether or not the model is showing */
  dialog: boolean = false;

  /** Yields the current two selected reports as an ExecDelta,  */
  get curr_delta(): ComparisonContext {
    let data_store = getModule(InspecDataModule, this.$store);
    const all_executions = data_store.contextualExecutions;
    return new ComparisonContext(all_executions);
  }

  /** Yields the control pairings in a more easily consumable list form */
  get control_sets(): ContextualizedControl[][] {
    return Object.values(this.curr_delta.pairings);
  }
}
</script>
