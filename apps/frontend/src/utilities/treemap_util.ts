import { HDFControl, NistHash, NistFamily, NistCategory } from "inspecjs";
import * as d3 from "d3";

// The type accepted by d3 treemap functions
export type TreemapDatumType =
  | NistHash
  | NistFamily
  | NistCategory
  | HDFControl;
export type TreemapNode = d3.HierarchyNode<TreemapDatumType>;

// Crappy type checkers; don't expect these to be safe elsewehre
export function isHDFControl(ctrl: TreemapDatumType): ctrl is HDFControl {
  return (ctrl as HDFControl).wraps !== undefined;
}

export function isNistGrouping(
  grp: TreemapDatumType
): grp is NistHash | NistFamily | NistCategory {
  return !isHDFControl(grp);
}

export function nistHashToTreeMap(hash: NistHash): TreemapNode {
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
      if (isNistGrouping(a.data) && isNistGrouping(b.data)) {
        a_s = a.data.name;
        b_s = b.data.name;
      } else {
        a_s = (a.data as HDFControl).wraps.id;
        b_s = (b.data as HDFControl).wraps.id;
      }
      return a_s.localeCompare(b_s);
    })
    .sum(d => {
      // We punish the type system a bit here but it doesn't really matter
      if (isNistGrouping(d)) {
        return 0; //d.count;
      } else {
        return 1;
      }
    });
  return ret;
}
