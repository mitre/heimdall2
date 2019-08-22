<template>
  <!-- We can use Vue transitions too! -->
  <g>
    <!-- Generate our children here -->
    <Cell
      v-for="child in node.children"
      :key="key_for(child.data)"
      :selected_node="selected_node"
      :selected_control_id="selected_control_id"
      :depth="child_depth"
      :node="child"
      :scales="scales"
      @select-node="select_node"
    />

    <!-- The actual body of this square.  width add selectedNode.x0-->
    <rect
      v-if="_depth >= 0"
      :key="label"
      :style="cell_style"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      :class="cell_classes"
      @click="select_node(node)"
      :rx="is_selected ? 20 : 0"
    />

    <text
      v-if="_depth === 1"
      dominant-baseline="middle"
      text-anchor="middle"
      :x="x + width / 2"
      :y="y + height / 2"
    >
      {{ label }}
    </text>
  </g>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import {
  ControlStatus,
  HDFControl,
  NistHash,
  ControlGroupStatus,
  NistCategory
} from "inspecjs";
import * as d3 from "d3";
import {
  TreemapDatumType,
  CCWrapper,
  isCCWrapper
} from "@/utilities/treemap_util";
import { control_unique_key } from "@/utilities/format_util";
import { HierarchyRectangularNode } from "d3";
import ColorHackModule from "@/store/color_hack";

export interface XYScale {
  scale_x: d3.ScaleLinear<number, number>;
  scale_y: d3.ScaleLinear<number, number>;
}

// We declare the props separately to make props types inferable.
const CellProps = Vue.extend({
  props: {
    selected_node: {
      type: Object, // Of type d3.HierarchyRectangularNode<TreemapDatumType>,
      required: true
    },
    selected_control_id: {
      type: String, // Of type string
      required: false
    },
    node: {
      type: Object, // Of type d3.HierarchyRectangularNode<TreemapDatumType>
      required: true
    },
    depth: {
      type: Number, // Distance of this node to curr selected. 0 => it is curr selected. undefined => Sub root / unknown
      required: false
    },
    scales: {
      type: Object, // Of type XYScale
      required: true
    }
  }
});

/**
 * Categories property must be of type Category
 * Emits "select-node" with payload of type d3.HierarchyRectangularNode<TreemapDatumType>
 */
@Component({
  components: {},
  name: "Cell"
})
export default class Cell extends CellProps {
  scale: number = 1.0;

  /** Provide typed getters */
  get _node(): d3.HierarchyRectangularNode<TreemapDatumType> {
    return this.node;
  }

  get _selected_node(): d3.HierarchyRectangularNode<TreemapDatumType> {
    return this.selected_node;
  }

  get _depth(): number | undefined {
    if (this.depth === undefined) {
      return this._node === this._selected_node ? 0 : undefined;
    } else {
      return this.depth;
    }
  }

  get _scale_x(): d3.ScaleLinear<number, number> {
    return this.scales.scale_x;
  }

  get _scale_y(): d3.ScaleLinear<number, number> {
    return this.scales.scale_y;
  }

  /** Depth to pass to childen */
  get child_depth(): number | undefined {
    if (this._depth !== undefined) {
      return this._depth + 1;
    } else {
      return undefined;
    }
  }

  /** Are we a control? */
  get is_control(): boolean {
    return isCCWrapper(this._node.data);
  }

  /** Are we selected? */
  get is_selected(): boolean {
    return (
      this.is_control &&
      (this._node.data as CCWrapper).ctrl.data.id === this.selected_control_id
    );
  }

  /** X, Y, Width and height calculators. All must be scaled */
  get x(): number {
    return this._scale_x(this._node.x0);
  }

  get y(): number {
    return this._scale_y(this._node.y0);
  }

  get width(): number {
    // Scale x0 and x1 required
    return this._scale_x(this._node.x1) - this.x;
  }

  get height(): number {
    return this._scale_y(this._node.y1) - this.y;
  }

  /** Classes for our "body" */
  get cell_classes(): string[] {
    // Type stuff
    let s: string[] = [];
    if (this.is_control) {
      s.push("control");
    } else {
      s.push("group");
      if ((this._node.data as NistCategory<CCWrapper>).children.length === 0) {
        s.push("empty");
      }
    }

    // Depth stuff
    if (this._depth === undefined) {
      s.push("unfocused");
    } else if (this._depth === 0) {
      s.push("root");
    } else if (this._depth === 1) {
      s.push("top");
    }

    return s;
  }

  get cell_style(): string {
    let style: string = "";
    style += `fill: ${this.color};`;
    if (this._depth === 1) {
      style += "pointer-events: auto;";
    } else {
      style += "pointer-events: none;";
    }
    return style;
  }

  // Callbacks for our tree
  select_node(n: null | d3.HierarchyRectangularNode<TreemapDatumType>): void {
    // Pass it up to root
    this.$emit("select-node", n);
  }

  /**
   * Looks up a color for the given piece of data
   * TODO: Shunt this to our color module
   */
  get color(): string {
    // Observe color
    let observed = this.$vuetify.theme.dark;
    let cmod = getModule(ColorHackModule, this.$store);
    let status: ControlGroupStatus = this._node.data.status;
    switch (status) {
      case "Passed":
        return cmod.lookupColor("statusPassed");
      case "Failed":
        return cmod.lookupColor("statusFailed");
      case "No Data":
        return cmod.lookupColor("statusNoData");
      case "Not Applicable":
        return cmod.lookupColor("statusNotApplicable");
      case "Not Reviewed":
        return cmod.lookupColor("statusNotReviewed");
      case "Profile Error":
        return cmod.lookupColor("statusProfileError");
      case "Empty":
        return "black";
      default:
        console.warn(`No treemap color defined for ${status}`);
        return "rgb(187, 187, 187)";
    }
  }

  /**
   * Provides a label for the given piece of data
   */
  get label() {
    if (isCCWrapper(this._node.data)) {
      return this._node.data.ctrl.data.id;
    } else {
      return this._node.data.name;
    }
  }

  /**
   * Generates unique keys
   */
  key_for(data: TreemapDatumType): string {
    if (isCCWrapper(data)) {
      return control_unique_key(data.ctrl);
    } else {
      return data.name;
    }
  }
}
</script>

<style scoped>
text {
  pointer-events: none;
}

.theme--dark text {
  fill: #fff;
  font-size: large;
}

.theme--light text {
  fill: #000;
}

rect {
  stroke: #888;
  fill-opacity: 0;
  stroke-width: 1;
}

rect.control {
  fill-opacity: 1;
  stroke-width: 0;
}

rect.control.top {
  stroke-width: 1;
}

rect.group.empty {
  fill-opacity: 0.1;
  fill: black;
}

rect.top.group:hover {
  fill-opacity: 0.1;
}
</style>
