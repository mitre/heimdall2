/**
 * Tools used for generating the treemaps consumed by, of course, the Treemap card and associated components.
 */

import {nist, context} from 'inspecjs';
import * as d3 from 'd3';
import {control_unique_key} from './format_util';
import {ColorHack} from '@/store/color_hack';
import Chroma from 'chroma-js';

// How deep into nist trees we allow
const MAX_DEPTH = 2;

/** A simple wrapper type representing what any node's data might be in our treemap */
interface AbsTreemapNode {
  title: string;
  subtitle?: string;
  hovertext?: string;
  key: string;
  color?: Chroma.Color;
  parent: TreemapNodeParent | null; // The parent of this node.
  nist_control: nist.NistControl; // The nist control which this node is associated with. Not necessarily unique (e.g. leaves)
}
export interface TreemapNodeParent extends AbsTreemapNode {
  children: TreemapNode[]; // Maps the next sub-specifier to children
}

export interface TreemapNodeLeaf extends AbsTreemapNode {
  control: context.ContextualizedControl;
}

export function is_leaf(n: TreemapNode): n is TreemapNodeLeaf {
  return (n as TreemapNodeLeaf).control !== undefined;
}

export function is_parent(n: TreemapNode): n is TreemapNodeParent {
  return (n as TreemapNodeParent).children !== undefined;
}

/** The type of our treemap nodes, prior to rendering */
export type TreemapNode = TreemapNodeLeaf | TreemapNodeParent;
export type D3TreemapNode = d3.HierarchyNode<TreemapNode>;

/**
 * Converts a list of controls to treemap leaves.
 * Actually a one-to-many mapping since we must make a unique leaf for each nist control on each control!
 * @param controls The controls to build into a nist node map
 */
function controls_to_nist_node_data(
  contextualized_controls: Readonly<context.ContextualizedControl[]>,
  colors: ColorHack
): TreemapNodeLeaf[] {
  return contextualized_controls.flatMap(cc => {
    // Get the status color
    let color = Chroma.hex(colors.colorForStatus(cc.root.hdf.status));
    // Now make leaves for each nist control
    return cc.root.hdf.parsed_nist_tags.map(nc => {
      let leaf: TreemapNodeLeaf = {
        title: cc.data.id,
        subtitle: cc.data.title || undefined,
        hovertext: cc.data.desc || undefined,
        key: control_unique_key(cc) + nc.raw_text,
        control: cc,
        nist_control: nc,
        color,
        parent: null // We set this later
      };
      return leaf;
    });
  });
}

/** Builds a scaffolding for the nist items using the given root.
 * Also constructs a lookup table of control nodes.
 * Only goes max_depth deep.
 */
function recursive_nist_map(
  parent: TreemapNodeParent | null,
  node: Readonly<nist.NistHierarchyNode>,
  control_lookup: {[key: string]: TreemapNodeParent},
  max_depth: number
): TreemapNodeParent {
  // Init child list
  let children: TreemapNode[] = [];

  // Make our final value
  let ret: TreemapNodeParent = {
    key: node.control.raw_text!,
    title: node.control.raw_text!, // TODO: Make this like, suck less. IE give more descriptive stuff
    nist_control: node.control,
    parent,
    children
  };

  // Fill our children
  if (node.control.sub_specifiers.length < max_depth) {
    node.children.forEach(child => {
      // Get the last subspec.
      let final_subspec =
        child.control.sub_specifiers[child.control.sub_specifiers.length - 1];

      // Assign it, recursively computing the rest
      children.push(recursive_nist_map(ret, child, control_lookup, max_depth));
    });
  }

  // Save to lookup
  control_lookup[lookup_key_for(node.control, max_depth)] = ret;
  return ret;
}

/** Colorizes a treemap based on each nodes children. */
function colorize_tree_map(root: TreemapNodeParent) {
  // First colorize children, recursively
  root.children.forEach(child => {
    if (is_parent(child)) {
      colorize_tree_map(child);
    }
  });

  // Now all children should have valid colors
  // We decide this node's color as a composite of all underlying node colors
  let child_colors = root.children
    .map(c => c.color)
    .filter(c => c !== undefined) as Chroma.Color[];
  // If we have any, then set our color
  if (child_colors.length) {
    // Set the color
    let avg_color = Chroma.average(child_colors);
    root.color = avg_color;
  }
}

/** Generates a lookup key for the given control */
function lookup_key_for(x: nist.NistControl, max_depth: number): string {
  if (max_depth) {
    return x.sub_specifiers.slice(0, max_depth).join('-');
  } else {
    return x.sub_specifiers.join('-');
  }
}

/** Populates a treemap using the given lookup table */
function populate_tree_map(
  lookup: {[key: string]: TreemapNodeParent},
  leaves: TreemapNodeLeaf[],
  max_depth: number
) {
  // Populate it
  leaves.forEach(leaf => {
    let parent = lookup[lookup_key_for(leaf.nist_control, max_depth)];
    if (parent) {
      // We found a node that will accept it (matches its control)
      // We can do this as because we know we constructed these to only have empty children
      parent.children.push(leaf);
      leaf.parent = parent;
    } else {
      console.warn(
        `Warning: unable to assign control ${leaf.nist_control.raw_text} to valid treemap leaf`
      );
    }
  });
}

/**
 * Assembles the provided leaves into a nist map.
 * Colorizes nodes as appropriate, and assigns parentage
 */
function build_populated_nist_map(
  data: TreemapNodeLeaf[],
  colors: ColorHack
): TreemapNodeParent {
  // Build our scaffold
  let lookup: {[key: string]: TreemapNodeParent} = {};
  let root_children: TreemapNodeParent[] = [];
  let root: TreemapNodeParent = {
    key: 'tree_root',
    title: 'NIST-853 Controls',
    children: root_children,
    parent: null,
    nist_control: new nist.NistControl([], 'NIST-853')
  };

  // Fill out children, recursively
  nist.FULL_NIST_HIERARCHY.forEach(n => {
    let child = recursive_nist_map(root, n, lookup, MAX_DEPTH);
    let tag = child.nist_control.sub_specifiers[0];
    root_children.push(child);
  });

  // Populate them with leaves
  populate_tree_map(lookup, data, MAX_DEPTH);

  // Colorize it
  colorize_tree_map(root);

  // Done
  return root;
}

/**
 * Generates a tree map from the given nist hash, using the size of each category to inversely scale it with controls.
 * Thus each category has a fixed weight!
 * Categories/Families are further sorted by name, and the
 *
 * @param data The nist hash to turn into a tree map
 */
function node_data_to_tree_map(
  data: Readonly<TreemapNodeParent>
): D3TreemapNode {
  let ret = d3
    .hierarchy<TreemapNode>(data, (d: TreemapNode) => {
      if (is_parent(d)) {
        return d.children;
      }
    })
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .sum(root => {
      if (is_parent(root)) {
        if (root.children.length === 0) {
          return 1;
        } else {
          // Children will make up the weight
          return 0;
        }
      } else {
        return 1.0 / root.parent!.children.length;
      }
    });
  return ret;
}

/** Does all the steps */
export function build_nist_tree_map(
  data: Readonly<context.ContextualizedControl[]>,
  colors: ColorHack
): D3TreemapNode {
  let leaves = controls_to_nist_node_data(data, colors);
  let b = build_populated_nist_map(leaves, colors);
  let c = node_data_to_tree_map(b);
  return c;
}
