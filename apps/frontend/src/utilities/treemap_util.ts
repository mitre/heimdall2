/**
 * Tools used for generating the treemaps consumed by, of course, the Treemap card and associated components.
 */

import Chroma from 'chroma-js';
import type { HierarchyNode } from 'd3-hierarchy';
import { hierarchy } from 'd3-hierarchy';
import type {
  ContextualizedControl,
  NistHierarchyNode,
} from 'inspecjs';
import {
  FULL_NIST_HIERARCHY,
  NistControl,
} from 'inspecjs';
import type { ColorHack } from '@/store/color_hack';
import { control_unique_key } from './format_util';

// How deep into nist trees we allow
const depthMax = 2;

export type D3TreemapNode = HierarchyNode<TreemapNode>;
/** The type of our treemap nodes, prior to rendering */
export type TreemapNode = TreemapNodeLeaf | TreemapNodeParent;

export type TreemapNodeLeaf = AbsTreemapNode & { control: ContextualizedControl };

export type TreemapNodeParent = AbsTreemapNode & { children: TreemapNode[]; // Maps the next sub-specifier to children
};

/** A simple wrapper type representing what any node's data might be in our treemap */
type AbsTreemapNode = {
  color?: Chroma.Color;
  hovertext?: string;
  key: string;
  nist_control: NistControl; // The nist control which this node is associated with. Not necessarily unique (e.g. leaves)
  parent: null | TreemapNodeParent; // The parent of this node.
  subtitle?: string;
  title: string;
};

/** Does all the steps */
export function build_nist_tree_map(
  data: readonly ContextualizedControl[],
  colors: ColorHack,
): D3TreemapNode {
  const leaves = controls_to_nist_node_data(data, colors);
  const b = build_populated_nist_map(leaves);
  return node_data_to_tree_map(b);
}
export function is_leaf(n: TreemapNode): n is TreemapNodeLeaf {
  return (n as TreemapNodeLeaf).control !== undefined;
}

export function is_parent(n: TreemapNode): n is TreemapNodeParent {
  return (n as TreemapNodeParent).children !== undefined;
}

/**
 * Assembles the provided leaves into a nist map.
 * Colorizes nodes as appropriate, and assigns parentage
 */
function build_populated_nist_map(data: TreemapNodeLeaf[]): TreemapNodeParent {
  // Build our scaffold
  const lookup: Record<string, TreemapNodeParent> = {};
  const rootChildren: TreemapNodeParent[] = [];
  const root: TreemapNodeParent = {
    children: rootChildren,
    key: 'tree_root',
    nist_control: new NistControl([], 'NIST-853'),
    parent: null,
    title: 'NIST-853 Controls',
  };

  // Fill out children, recursively
  for (const n of FULL_NIST_HIERARCHY) {
    const child = recursive_nist_map(root, n, lookup, depthMax);
    rootChildren.push(child);
  }

  // Populate them with leaves
  populate_tree_map(lookup, data, depthMax);

  // Colorize it
  colorize_tree_map(root);

  // Done
  return root;
}

/** Colorizes a treemap based on each nodes children. */
function colorize_tree_map(root: TreemapNodeParent) {
  // First colorize children, recursively
  for (const child of root.children) {
    if (is_parent(child)) {
      colorize_tree_map(child);
    }
  }

  // Now all children should have valid colors
  // We decide this node's color as a composite of all underlying node colors
  const childColors = root.children
    .map(c => c.color)
    .filter((c): c is Chroma.Color => !!c);
  // If we have any, then set our color
  if (childColors.length > 0) {
    // Set the color
    const avgColor = Chroma.average(childColors);
    root.color = avgColor;
  }
}

/**
 * Converts a list of controls to treemap leaves.
 * Actually a one-to-many mapping since we must make a unique leaf for each nist control on each control!
 * @param controls The controls to build into a nist node map
 */
function controls_to_nist_node_data(
  contextualizedControls: readonly ContextualizedControl[],
  colors: ColorHack,
): TreemapNodeLeaf[] {
  return contextualizedControls.flatMap((cc) => {
    // Get the status color
    const color = Chroma(colors.colorForStatus(cc.root.hdf.status));
    // Now make leaves for each nist control
    return cc.root.hdf.parsedNistTags.map((nc: NistControl) => {
      return {
        color,
        control: cc,
        hovertext: cc.data.desc || undefined,
        key: control_unique_key(cc) + nc.rawText,
        nist_control: nc,
        parent: null, // We set this later
        subtitle: cc.data.title || undefined,
        title: cc.data.id,
      };
    });
  });
}

/** Generates a lookup key for the given control */
function lookup_key_for(x: NistControl, maxDepth: number): string {
  return maxDepth ? x.subSpecifiers.slice(0, maxDepth).join('-') : x.subSpecifiers.join('-');
}

/**
 * Generates a tree map from the given nist hash, using the size of each category to inversely scale it with controls.
 * Thus each category has a fixed weight!
 * Categories/Families are further sorted by name, and the
 *
 * @param data The nist hash to turn into a tree map
 */
function node_data_to_tree_map(
  data: Readonly<TreemapNodeParent>,
): D3TreemapNode {
  return hierarchy<TreemapNode>(data, (d: TreemapNode) => {
    if (is_parent(d)) {
      return d.children;
    }
    return null;
  })
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .sum((root) => {
      if (is_parent(root)) {
        if (root.children.length === 0) {
          return 1;
        }
      } else if (root.parent !== null) {
        return 1 / root.parent.children.length;
      }
      return 0;
    });
}

/** Populates a treemap using the given lookup table */
function populate_tree_map(
  lookup: Record<string, TreemapNodeParent>,
  leaves: TreemapNodeLeaf[],
  maxDepth: number,
) {
  // Populate it
  for (const leaf of leaves) {
    const parent = lookup[lookup_key_for(leaf.nist_control, maxDepth)];
    if (parent) {
      // We found a node that will accept it (matches its control)
      // We can do this as because we know we constructed these to only have empty children
      parent.children.push(leaf);
      leaf.parent = parent;
    } else {
      console.warn(
        `Warning: unable to assign control ${leaf.nist_control.rawText} to valid treemap leaf`,
      );
    }
  }
}

/** Builds a scaffolding for the nist items using the given root.
 * Also constructs a lookup table of control nodes.
 * Only goes maxDepth deep.
 */
function recursive_nist_map(
  parent: null | TreemapNodeParent,
  node: Readonly<NistHierarchyNode>,
  controlLookup: Record<string, TreemapNodeParent>,
  maxDepth: number,
): TreemapNodeParent {
  // Init child list
  const children: TreemapNode[] = [];

  // Make our final value
  const ret: TreemapNodeParent = {
    children,
    key: node.control.rawText || '',
    nist_control: node.control,
    parent,
    title: node.control.rawText || '',
  };

  // Fill our children
  if (node.control.subSpecifiers.length < maxDepth) {
    for (const child of node.children) {
      // Assign it, recursively computing the rest
      children.push(recursive_nist_map(ret, child, controlLookup, maxDepth));
    }
  }

  // Save to lookup
  controlLookup[lookup_key_for(node.control, maxDepth)] = ret;
  return ret;
}
