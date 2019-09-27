<template>
  <v-card>
    <v-row>
      <!-- Control ID -->
      <v-col cols="2" class="pt-0">
        <v-card class="fill-height" color="info">
          <v-card-title> {{ hdf_controls[0].wraps.id }} </v-card-title>
        </v-card>
      </v-col>

      <!-- Various Statuses -->
      <v-col cols="10">
        <v-chip-group multiple max="2" v-model="selection">
          <v-chip
            v-for="(control, index) in hdf_controls"
            filter
            :key="index"
            :value="index"
          >
            {{ control.status }}
          </v-chip>
        </v-chip-group>
      </v-col>

      <!-- Depending on selection, more details -->
      <!-- <transition-group> -->
      <v-col cols="12" v-if="delta" key="delta">
        <DeltaView :delta="delta" />
      </v-col>
      <v-col cols="12" v-if="details" key="detail">
        Details goes here
      </v-col>
      <!-- </transition-group> -->
    </v-row>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { ContextualizedControl } from "@/store/data_store";
import { HDFControl, hdfWrapControl } from "inspecjs";
import { ControlDelta } from "@/utilities/delta_util";
import DeltaView from "@/components/cards/comparison/DeltaView.vue";

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {
    controls: Array // Of type Array<ContextualizedControl>
  }
});

@Component({
  components: {
    DeltaView
  }
})
export default class CompareRow extends Props {
  /** Models the currently selected chips. If it's a number */
  selection: number[] = [];

  /** Initialize our selection */
  mounted() {
    // Pick the first and last control, or as close as we can get to that
    if (this._controls.length === 0) {
      this.selection = [];
    } else if (this._controls.length === 1) {
      this.selection = [0];
    } else {
      this.selection = [0, this._controls.length - 1];
    }
  }

  /** Provides actual data about which controls we have selected */
  get selected_controls(): ContextualizedControl[] {
    // Multiple selected
    return this.selection.map(i => this._controls[i]);
  }

  /** Typed getter on controls */
  get _controls(): ContextualizedControl[] {
    return this.controls as ContextualizedControl[];
  }

  /** Just maps controls to hdf. Makes our template a bit less verbose */
  get hdf_controls(): HDFControl[] {
    return this._controls.map(c => hdfWrapControl(c.data));
  }

  /** If exactly two controls selected, provides a delta. Elsewise gives null */
  get delta(): ControlDelta | null {
    if (this.selected_controls.length === 2) {
      return new ControlDelta(
        this.selected_controls[0],
        this.selected_controls[1]
      );
    }
    return null;
  }

  /** Returns the HDF control that we want to show details for iff it is the only selected control */
  get details(): HDFControl | null {
    if (this.selected_controls.length === 1) {
      return hdfWrapControl(this.selected_controls[0].data);
    }
    return null;
  }

  /** If more than one row selected */
}
</script>
