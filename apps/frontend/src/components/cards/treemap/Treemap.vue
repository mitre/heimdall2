<template>
  <v-container fluid>
    <v-row dense>
      <v-col :cols="4">
        NIST SP 800-53 Coverage
      </v-col>
      <v-col :cols="8">
        <v-btn @click="up" :disabled="!allow_up" block x-small>
          <v-icon v-if="allow_up"> mdi-arrow-left </v-icon>
          {{ selected_node.data.name }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col :cols="12" v-resize:debounce="on_resize">
        <svg id="chartBody" :width="width" :height="height">
          <g
            style="shape-rendering: crispEdges;"
            preserveAspectRatio="xMidYMid meet"
          >
            <!-- The body -->
            <Cell
              :selected_node="selected_node"
              :selected_control_id="value.selectedControlID"
              :node="treemap_layout"
              :scales="scales"
              @select-node="select_node"
            />
          </g>
        </svg>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
//               preserveAspectRatio="xMidYMid meet"
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import { ControlStatus, HDFControl, nist, hdfWrapControl } from "inspecjs";
import * as d3 from "d3";
import FilteredDataModule, { NistMapState } from "@/store/data_filters";
import {
  nistHashToTreeMap,
  TreemapNode,
  TreemapDatumType,
  nistHashForControls,
  CCWrapper
} from "@/utilities/treemap_util";
import { HierarchyRectangularNode, tree } from "d3";
import Cell, { XYScale } from "@/components/cards/treemap/Cell.vue";
//@ts-ignore
import resize from "vue-resize-directive";

// We declare the props separately to make props types inferable.
const TreemapProps = Vue.extend({
  props: {
    value: {
      type: Object, // Of type NistMapState
      required: true
    },
    filter: {
      type: Object, // Of type Filter
      required: true
    }
  }
});

/**
 * Categories property must be of type Category
 * Emits "filter-status" with payload of type ControlStatus
 */
@Component({
  components: {
    Cell
  },
  directives: {
    resize
  }
})
export default class Treemap extends TreemapProps {
  /** The svg internal coordinate space */
  width: number = 1600;
  height: number = 530;

  /** The currently selected treemap node. Wrapped to avoid initialization woes */
  get selected_node(): d3.HierarchyRectangularNode<TreemapDatumType> {
    // Get typed versions of the curr state
    let val: NistMapState = this.value;
    let curr = this.treemap_layout;

    // Try to go to the selected family
    // If we cannot go, fail out and update the state
    if (val.selectedFamily) {
      let new_curr = curr.children!.find(
        child =>
          (child.data as nist.NistFamily<CCWrapper>).name === val.selectedFamily
      );
      if (new_curr !== undefined) {
        curr = new_curr;
      } else {
        // Unable to go to the specified family
        let revised: NistMapState = {
          selectedFamily: null, // This one failed
          selectedCategory: null,
          selectedControlID: null
        };
        this.$emit("input", revised);
        return curr;
      }
    }
    // Try to go to the selected category
    // If we cannot go, fail out and update the state
    if (val.selectedCategory) {
      let new_curr = curr.children!.find(
        child =>
          (child.data as nist.NistCategory<CCWrapper>).name ===
          val.selectedCategory
      );
      if (new_curr !== undefined) {
        curr = new_curr;
      } else {
        // Unable to go to the specified category
        let revised: NistMapState = {
          selectedFamily: val.selectedFamily, // This one went off ok
          selectedCategory: null, // This one failed
          selectedControlID: null
        };
        this.$emit("input", revised);
        return curr;
      }
    }

    // Check the selected category. We don't actually go to it, just validate that it exists
    if (val.selectedControlID) {
      let test_curr = curr.children!.find(
        child =>
          (child.data as CCWrapper).ctrl.data.id === val.selectedControlID
      );
      if (test_curr == undefined) {
        // Unable to go to the specified control
        let revised: NistMapState = {
          selectedFamily: val.selectedFamily, // This one went off ok
          selectedCategory: val.selectedCategory, // This one as well
          selectedControlID: null // This one failed
        };
        this.$emit("input", revised);
      }
    }

    // Return as deep as we travelled
    return curr;
  }

  /** Get our viewbox */
  get view_box(): string {
    return `0 0 ${this.width} ${this.height}`;
  }

  /** Get our scales */
  get scales(): XYScale {
    return {
      scale_x: d3
        .scaleLinear()
        .domain([this.selected_node.x0, this.selected_node.x1])
        .range([0, this.width]),
      scale_y: d3
        .scaleLinear()
        .domain([this.selected_node.y0, this.selected_node.y1])
        .range([0, this.height])
    };
  }

  /**
   * Fetches the controls we want to display in this tree, and turns them into a hash
   * Note that regardless of what filtering this treeview applies,
   * we want the treeview itself to remain unaffected.
   */
  get nist_hash(): nist.NistHash<CCWrapper> {
    // Get our data module
    let data: FilteredDataModule = getModule(FilteredDataModule, this.$store);

    // Get the current filtered data
    let controls = data.controls(this.filter);
    return nistHashForControls(controls);
  }

  /** Generates a d3 heirarchy structure, with appropriate bounds to our width
   *  detailing all of the controls in the nist hash */
  get treemap_layout(): d3.HierarchyRectangularNode<TreemapDatumType> {
    let hierarchy = nistHashToTreeMap(this.nist_hash);
    let treemap = d3
      .treemap<TreemapDatumType>()
      .size([this.width, this.height])
      .round(false)
      .paddingInner(0)(hierarchy);
    return treemap;
  }

  // Callbacks for our tree
  select_node(n: d3.HierarchyRectangularNode<TreemapDatumType>): void {
    // Get our path to the selected node
    let route = n.ancestors().reverse();

    // Initialize all as null
    let selected_family: string | null = null;
    let selected_category: string | null = null;
    let selected_control_id: string | null = null;

    // Depending on length of route, assign values
    if (route.length > 1) {
      selected_family = (route[1].data as nist.NistFamily<CCWrapper>).name;
    }
    if (route.length > 2) {
      selected_category = (route[2].data as nist.NistCategory<CCWrapper>).name;
    }
    if (route.length > 3) {
      selected_control_id = (route[3].data as CCWrapper).ctrl.data.id;
      // If they click the same one, clear
      if (selected_control_id === this.value.selectedControlID) {
        selected_control_id = null;
      }
    }

    // Construct the state and emit
    let new_state: NistMapState = {
      selectedFamily: selected_family,
      selectedCategory: selected_category,
      selectedControlID: selected_control_id
    };
    this.$emit("input", new_state);
  }

  /** Submits an event to go up one node */
  up(): void {
    if (this.selected_node.parent !== null) {
      this.select_node(this.selected_node.parent);
    }
  }

  /** Controls whether we should allow up */
  get allow_up(): boolean {
    return this.selected_node.parent !== null;
  }

  /** Called on resize */
  on_resize(elt: any) {
    if (elt.clientWidth !== undefined && elt.clientWidth > 1) {
      this.width = elt.clientWidth - 24;
    }
  }
}
</script>

<style scoped>
text {
  pointer-events: none;
  font-weight: bold;
  font-size: 1.1em;
  fill: "primary";
}

rect {
  fill: none;
}
</style>
