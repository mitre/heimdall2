<template>
  <!-- We can use Vue transitions too! -->
  <g>
    <!-- Generate our children here. Only do so for parents, and if they aren't too deep -->
    <g v-if="is_parent">
      <Cell
        v-for="child in node.children"
        :key="child.data.key"
        :selected_control_id="selected_control_id"
        :depth="depth + 1"
        :node="child"
        :scales="scales"
        @select-node="select_node"
      />
    </g>

    <!-- The actual body of this square. Visible only if depth === 1 (ie a direct child of parent) or depth === 2 (one level deeper) -->
    <rect
      v-if="depth >= 1"
      :style="cell_style"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      :class="cell_classes"
      :rx="is_selected ? 20 : 0"
      @click="select_node(node)"
    />

    <text
      v-if="_depth === 1"
      dominant-baseline="middle"
      text-anchor="middle"
      :x="x + width / 2"
      :y="y + height / 2"
      >{{ node.data.title }}</text
    >
  </g>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import * as d3 from 'd3';
import {TreemapNode, TreemapNodeLeaf, is_leaf} from '@/utilities/treemap_util';
import {HierarchyRectangularNode} from 'd3';

export interface XYScale {
  scale_x: d3.ScaleLinear<number, number>;
  scale_y: d3.ScaleLinear<number, number>;
}

// We declare the props separately to make props types inferable.
const CellProps = Vue.extend({
  props: {
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
      required: false,
      default: 0
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
  name: 'Cell'
})
export default class Cell extends CellProps {
  scale: number = 1.0;

  /**
   * Typed getter for this Cell's node, IE the rectangle that it is in charge of drawing.
   */
  get _node(): d3.HierarchyRectangularNode<TreemapNode> {
    return this.node;
  }

  /**
   * Typed getter for depth that also automatically substitutes "undefined" for 0 where appropriate
   * To be clear, "appropriate" is when this is the selected node, using Object.is
   */
  get _depth(): number {
    return this.depth;
  }

  /** Typed getter for scale_x prop. Performs no type checking.
   * The scale_x prop is the x domain of the current "viewport",
   * except not using svg viewports due to their text scaling properties.
   * It is shared and equal between all nodes, changing in response to the selected node changing.
   */
  get _scale_x(): d3.ScaleLinear<number, number> {
    return this.scales.scale_x;
  }

  /** Typed getter for scale_y prop. Performs no type checking.
   * The scale_y prop is the y domain of the current "viewport",
   * except not using svg viewports due to their text scaling properties.
   * It is shared and equal between all nodes, changing in response to the selected node changing.
   */
  get _scale_y(): d3.ScaleLinear<number, number> {
    return this.scales.scale_y;
  }

  /** Are we a control? Use treemap util type checker */
  get is_control(): boolean {
    return is_leaf(this._node.data);
  }

  /** Invert of above. Checks if this node has children, essentially */
  get is_parent(): boolean {
    return !this.is_control;
  }

  /** Are we selected? True if selected_control_id matches our id, and we are in selected heirarchy */
  get is_selected(): boolean {
    return (
      this.is_control && // We are a control
      this._depth !== undefined && // Implies an ancesrtor is selected
      (this._node.data as TreemapNodeLeaf).control.data.id ===
        this.selected_control_id // Our control id matches
    );
  }

  /** Compute the top-left x coord of this cell rect based on the provided scale_x prop */
  get x(): number {
    return this._scale_x(this._node.x0);
  }

  /** Compute the top-left y coord of this cell rect based on the provided scale_y prop */
  get y(): number {
    return this._scale_y(this._node.y0);
  }

  /**
   * Compute the width of this rect based on scale, and base x position
   */
  get width(): number {
    return this._scale_x(this._node.x1) - this.x;
  }

  /**
   * Compute the height of this rect based on scale, and base y position
   */
  get height(): number {
    return this._scale_y(this._node.y1) - this.y;
  }

  /** Returns a list of classes appropriate to this nodes Rect
   * These are contextual based on type of data, and depth within the tree
   */
  get cell_classes(): string[] {
    // Type stuff
    let s: string[] = [];
    if (this.is_parent) {
      s.push('parent');
      if (!this._node.children || !this._node.children.length) {
        s.push('empty');
      }
    } else {
      s.push('leaf');
    }

    // Depth stuff
    if (this._depth === 0) {
      s.push('root');
    } else if (this._depth === 1) {
      s.push('top');
    } else if (this._depth >= 1) {
      s.push('nested');
    }

    return s;
  }

  get cell_style(): string {
    if (this._node.data.color) {
      return `fill: ${this._node.data.color.css()};`;
    }
    return 'fill-opacity: 0';
  }

  /**
   * Callback fired when the user clicks a node. Passes up from cell to cell until it reaches Treemap
   */
  select_node(n: d3.HierarchyRectangularNode<TreemapNode>): void {
    // Pass it up to root
    this.$emit('select-node', n);
  }
}
</script>

<style scoped>
text {
  pointer-events: none;
}

.theme--dark text {
  fill: #f8f8f8;
  font-size: large;
}

.theme--light text {
  fill: #000;
  font-size: large;
}

/* Basic settings for our chart. Things unclickable by default */
rect {
  stroke: #000000;
  pointer-events: none;
  fill-opacity: 0;
}

/* We want top to be clickable. */
rect.top {
  pointer-events: auto;
  stroke-width: 2;
}

/* We want leaves */
rect.leaf {
  fill-opacity: 1;
}

/* Otherwise, don't want nested to draw strokes */
rect.nested {
  stroke-width: 1;
}

rect.nested.leaf {
  stroke-width: 0;
}

/* Make tops transparent but also more thickly drawn when hovered */
rect.top:hover {
  stroke-width: 3;
}
</style>
