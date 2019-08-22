import {
  HDFControl,
  NistHash,
  NistFamily,
  NistCategory,
  hdfWrapControl,
  ControlStatus,
  generateNewNistHash,
  populateNistHash
} from "inspecjs";
import * as d3 from "d3";
import { ContextualizedControl } from "@/store/data_store";

/**
 * A simple wrapping class needed to facilitate inspecjs nist function usage
 */
export class CCWrapper {
  ctrl: ContextualizedControl;
  hdf: HDFControl;
  category?: NistCategory<CCWrapper>;

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

// The type accepted by d3 treemap functions
export type TreemapDatumType =
  | NistHash<CCWrapper>
  | NistFamily<CCWrapper>
  | NistCategory<CCWrapper>
  | CCWrapper;
export type TreemapNode = d3.HierarchyNode<TreemapDatumType>;

// Crappy type checkers; don't expect these to be safe elsewehre
export function isCCWrapper(ctrl: TreemapDatumType): ctrl is CCWrapper {
  return (ctrl as CCWrapper).hdf !== undefined;
}

export function isNistGrouping(
  grp: TreemapDatumType
): grp is
  | NistHash<CCWrapper>
  | NistFamily<CCWrapper>
  | NistCategory<CCWrapper> {
  return !isCCWrapper(grp);
}

export function nistHashForControls(
  controls: ContextualizedControl[]
): NistHash<CCWrapper> {
  // Generate the hash
  let wrapped_controls = controls.map(c => new CCWrapper(c));
  let hash = generateNewNistHash<CCWrapper>();
  populateNistHash(wrapped_controls, hash);

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

export function nistHashToTreeMap(hash: NistHash<CCWrapper>): TreemapNode {
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
