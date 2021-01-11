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
      v-if="depth === 1"
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
import {Prop} from 'vue-property-decorator';

export interface XYScale {
  scale_x: d3.ScaleLinear<number, number>;
  scale_y: d3.ScaleLinear<number, number>;
}

/**
 * Categories property must be of type Category
 * Emits "select-node" with payload of type d3.HierarchyRectangularNode<TreemapNode>
 */
@Component({
  name: 'Cell'
})
export default class Cell extends Vue {
  @Prop({type: String}) readonly selected_control_id!: string;
  @Prop({type: Object, required: true})
  readonly node!: d3.HierarchyRectangularNode<TreemapNode>;
  @Prop({type: Number, default: 0}) readonly depth!: number;
  @Prop({type: Object, default: 0}) readonly scales!: XYScale;

  scale: number = 1.0;

  /** Are we a control? Use treemap util type checker */
  get is_control(): boolean {
    return is_leaf(this.node.data);
  }

  /** Invert of above. Checks if this node has children, essentially */
  get is_parent(): boolean {
    return !this.is_control;
  }

  /** Are we selected? True if selected_control_id matches our id, and we are in selected hierarchy */
  get is_selected(): boolean {
    return (
      this.is_control && // We are a control
      (this.node.data as TreemapNodeLeaf).control.data.id ===
        this.selected_control_id // Our control id matches
    );
  }

  /** Compute the top-left x coord of this cell rect based on the provided scale_x prop */
  get x(): number {
    return this.scales.scale_x(this.node.x0);
  }

  /** Compute the top-left y coord of this cell rect based on the provided scale_y prop */
  get y(): number {
    return this.scales.scale_y(this.node.y0);
  }

  /**
   * Compute the width of this rect based on scale, and base x position
   */
  get width(): number {
    return this.scales.scale_x(this.node.x1) - this.x;
  }

  /**
   * Compute the height of this rect based on scale, and base y position
   */
  get height(): number {
    return this.scales.scale_y(this.node.y1) - this.y;
  }

  /** Returns a list of classes appropriate to this nodes Rect
   * These are contextual based on type of data, and depth within the tree
   */
  get cell_classes(): string[] {
    let s: string[] = [];
    if (this.is_parent) {
      s.push('parent');
      if (!this.node.children || !this.node.children.length) {
        s.push('empty');
      }
    } else {
      s.push('leaf');
    }

    // Depth stuff
    if (this.depth === 0) {
      s.push('root');
    } else if (this.depth === 1) {
      s.push('top');
    } else if (this.depth >= 1) {
      s.push('nested');
    }

    return s;
  }

  get cell_style(): string {
    if (this.node.data.color) {
      return `fill: ${this.node.data.color.css()};`;
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
