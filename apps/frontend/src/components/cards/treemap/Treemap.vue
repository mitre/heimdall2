<template>
  <v-container ref="treemapContainer" fluid>
    <v-row dense>
      <v-col :cols="4">
        NIST SP 800-53 Security and Privacy Control Coverage
      </v-col>
      <v-col :cols="8">
        <v-btn :disabled="!allow_up" block x-small @click="up">
          <v-icon v-if="allow_up"> mdi-arrow-left </v-icon>
          {{ 'NIST-SP-800-53 -> ' + value.join(' -> ') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col v-resize="on_resize" :cols="12">
        <svg id="chartBody" :width="width" :height="height">
          <g
            style="shape-rendering: crispEdges"
            preserveAspectRatio="xMidYMid meet"
          >
            <!-- The body -->
            <Cell
              :selected_control_id="selected_control"
              :node="selected_node"
              :scales="scales"
              :depth="0"
              @select-node="select_node"
            />
          </g>
        </svg>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Cell, {XYScale} from '@/components/cards/treemap/Cell.vue';
import {ColorHackModule} from '@/store/color_hack';
import {
  ControlsFilter,
  FilteredDataModule,
  TreeMapState
} from '@/store/data_filters';
import {compareArrays} from '@/utilities/helper_util';
import {
  build_nist_tree_map,
  is_leaf,
  is_parent,
  TreemapNode
} from '@/utilities/treemap_util';
import {HierarchyRectangularNode, scaleLinear, treemap} from 'd3';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, PropSync, Ref} from 'vue-property-decorator';

// Respects a v-model of type TreeMapState
@Component({
  components: {
    Cell
  }
})
export default class Treemap extends Vue {
  @Ref('treemapContainer') readonly treemapContainer!: Element;
  @Prop({type: Array, required: true}) readonly value!: TreeMapState;
  @Prop({type: Object, required: true}) readonly filter!: ControlsFilter;
  @PropSync('selected_control', {type: String}) syncedSelectedControl!:
    | string
    | null;

  /** The svg internal coordinate space */
  width = 1600;
  height = 530;

  /** The currently selected treemap node. Wrapped to avoid initialization woes */
  get selected_node(): HierarchyRectangularNode<TreemapNode> {
    // Get typed versions of the curr state
    // Set curr to root
    let curr = this.treemap_layout;
    let depth = 0;

    try {
      for (; depth < this.value.length; depth++) {
        // If the current has no children, then just bail here
        if (curr.children === undefined) {
          throw Error('no children to go into');
        }

        // Fetch the next path spec
        const nextSpecifiers = this.value.slice(0, depth + 1);

        const newCurr = curr.children.find((child) => {
          if (is_parent(child.data)) {
            const ssA = child.data.nist_control.subSpecifiers;
            return (
              compareArrays(ssA, nextSpecifiers, (a, b) =>
                a.localeCompare(b)
              ) === 0
            );
          } else {
            return false; // We cannot go into a leaf (OR CAN WE? MUST DECIDE, AT SOME POINT)
          }
        });
        if (newCurr) {
          if (newCurr.children && newCurr.children.length) {
            curr = newCurr;
          } else {
            throw Error('empty');
          }
        } else {
          throw Error('truncate');
        }
      }
    } catch (someTraversalError) {
      // Slice to last successful depth. Slice is non inclusive so this works
      this.set_path(this.value.slice(0, depth));
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
      scale_x: scaleLinear()
        .domain([this.selected_node.x0, this.selected_node.x1])
        .range([0, this.width]),
      scale_y: scaleLinear()
        .domain([this.selected_node.y0, this.selected_node.y1])
        .range([0, this.height])
    };
  }

  /** Generates a d3 hierarchy structure, with appropriate bounds to our width
   *  detailing all of the controls in the nist hash */
  get treemap_layout(): HierarchyRectangularNode<TreemapNode> {
    // Get the current filtered data
    const controls = FilteredDataModule.controls(this.filter);

    // Build the map
    const hierarchy = build_nist_tree_map(controls, ColorHackModule);
    return treemap<TreemapNode>()
      .size([this.width, this.height])
      .round(false)
      .paddingInner(0)(hierarchy);
  }

  // Callbacks for our tree
  select_node(n: HierarchyRectangularNode<TreemapNode>): void {
    // If it is a leaf, then select it
    if (is_leaf(n.data)) {
      const id = n.data.control.data.id;
      this.syncedSelectedControl =
        id !== this.syncedSelectedControl ? id : null;
    } else {
      // Otherwise, dive away. Set course for the leading title
      const cntrl = n.data.nist_control;
      if (cntrl) {
        this.set_path(cntrl.subSpecifiers);
      }
    }
  }

  /** Submits an event to go up one node */
  up(): void {
    if (this.value.length) {
      // Slice and dice, baybee
      this.set_path(this.value.slice(0, this.value.length - 1));

      // Also clear selected
      this.syncedSelectedControl = null;
    }
  }

  /** Typed method to wrap changes in the depth */
  set_path(pathSpec: TreeMapState) {
    this.$emit('input', pathSpec);
  }

  /** Controls whether we should allow up */
  get allow_up(): boolean {
    return this.value.length > 0;
  }

  /** Called on resize */
  on_resize() {
    this.width = this.treemapContainer.clientWidth;
  }
}
</script>

<style scoped>
text {
  pointer-events: none;
  font-weight: bold;
  font-size: 1.1em;
  fill: 'primary';
}

rect {
  fill: none;
}
</style>
