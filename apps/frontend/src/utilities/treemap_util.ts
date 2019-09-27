/**
 * Tools used for generating the treemaps consumed by, of course, the Treemap card and associated components.
 */

import { HDFControl, hdfWrapControl, ControlStatus, nist } from "inspecjs";
import * as d3 from "d3";
import { ContextualizedControl } from "@/store/data_store";

/**
 * A simple wrapping class needed to facilitate inspecjs nist function usage
 */
export class CCWrapper {
  ctrl: ContextualizedControl;
  hdf: HDFControl;
  category?: nist.NistCategory<CCWrapper>;

  constructor(ctrl: ContextualizedControl) {
    this.ctrl = ctrl;
    this.hdf = hdfWrapControl(ctrl.data);
    this.category = undefined;
  }

  get fixed_nist_tags(): string[] {
    return this.hdf.fixed_nist_tags;
  }

  get status(): ControlStatus {
    return this.hdf.status;
  }
}

/** A simple wrapper type representing what any node's data might be in our treemap */
export type TreemapDatumType =
  | nist.NistHash<CCWrapper>
  | nist.NistFamily<CCWrapper>
  | nist.NistCategory<CCWrapper>
  | CCWrapper;

/** The type of our treemap nodes, prior to rendering */
export type TreemapNode = d3.HierarchyNode<TreemapDatumType>;

/**
 * A crappy type checker capable of distinguishing CCWrapper data from other data in our treemap.
 * Shouldn't be used anywhere outside of treemap
 */
export function isCCWrapper(ctrl: TreemapDatumType): ctrl is CCWrapper {
  return (ctrl as CCWrapper).hdf !== undefined;
}

/**
 * A crappy type checker capable of distinguishing Nist group data from other data in our treemap.
 * Shouldn't be used anywhere outside of treemap
 */
export function isNistGrouping(
  grp: TreemapDatumType
): grp is
  | nist.NistHash<CCWrapper>
  | nist.NistFamily<CCWrapper>
  | nist.NistCategory<CCWrapper> {
  return !isCCWrapper(grp);
}

/** Generates a NistHash for the provided set of controls.
 * Said nist hash is templatized on the type CCWrapper, and is slightly unique to our use case in that
 * the NistCategory <-> CCWrapper relation is one-to-one, on the CCWrapper.category prop.
 *
 * This lets us generate fixed-layout treemaps!
 */
export function nistHashForControls(
  controls: Readonly<ContextualizedControl[]>
): nist.NistHash<CCWrapper> {
  // Generate the hash
  let wrapped_controls = controls.map(c => new CCWrapper(c));
  let hash = nist.generateNewNistHash<CCWrapper>();
  nist.populateNistHash(wrapped_controls, hash);

  // Bind the categories
  hash.children.forEach(family => {
    family.children.forEach(category => {
      category.children = category.children.map(cc => {
        let specific = new CCWrapper(cc.ctrl);
        specific.category = category;
        return specific;
      });
    });
  });

  return hash;
}

/**
 * Generates a tree map from the given nist hash, using the size of each category to inversely scale it with controls.
 * Thus each category has a fixed weight!
 * Categories/Families are further sorted by name, and the
 *
 * @param hash The nist hash to turn into a tree map
 */
export function nistHashToTreeMap(
  hash: Readonly<nist.NistHash<CCWrapper>>
): TreemapNode {
  // Find the largest count category. We use this to set the weights in individual controls so they fill their parent
  let biggest = 1;
  hash.children.forEach(family => {
    family.children.forEach(category => {
      if (category.count > biggest) {
        biggest = category.count;
      }
    });
  });

  // Build the heirarchy
  let ret = d3
    .hierarchy<TreemapDatumType>(hash, (d: TreemapDatumType) => {
      if (isNistGrouping(d)) {
        return d.children;
      }
    })
    .sort((a, b) => {
      let a_s: string;
      let b_s: string;
      // If a group, give the name. If a control, give status+name
      if (isNistGrouping(a.data)) {
        a_s = a.data.name;
      } else {
        a_s = a.data.status + a.data.ctrl.data.id;
      }

      //ditto
      if (isNistGrouping(b.data)) {
        b_s = b.data.name;
      } else {
        b_s = b.data.status + b.data.ctrl.data.id;
      }

      return a_s.localeCompare(b_s);
    })
    // Determines the weight of the table
    // We want the families to have a fixed layout, so this is fairly constant
    .sum(d => {
      // Note that these give individual weightings - d3 does the actual summing for us
      if (isNistGrouping(d)) {
        if (d.children.length === 0) {
          // Empty elements given a base size
          return 1;
        } else {
          return 0;
        }
      } else {
        // Controls fill their parent, proportionally
        return 1.0 / d.category!.count;
      }
    });
  return ret;
}
