import InspecDataModule from "@/store/data_store";

/** For helper functions that don't belong anywhere else */

/** Compares arrays a and b, returning a number indicating their lexicographic ordering
 * with the same output semantics.
 * That is,
 * a === b as determined by the comparator function, return 0;
 * if a is lexicographically before b, return < 0
 * if a is lexicographically after  b, return > 1
 */
export function compare_arrays<T>(
  a: Array<T>,
  b: Array<T>,
  comparator: (a: T, b: T) => number
) {
  // Compare element-wise
  for (let i = 0; i < a.length && i < b.length; i++) {
    let x = comparator(a[i], b[i]);
    if (x) {
      return x;
    }
  }

  // If we escape the loop, make final decision based on difference in length
  if (a.length > b.length) {
    // a longer => a after b => return positive
    return 1;
  } else if (a.length === b.length) {
    // Completely equal
    return 0;
  } else {
    // b longer => a before b => Return negative
    return -1;
  }
}

/** Returns two values: if we need to redirect, and if so to where  */
export function need_redirect_file(
  curr_target: number | null,
  data: InspecDataModule
): "ok" | number | "root" {
  // If we have no files, always exit
  if (data.allFiles.length === 0) {
    return "root";
  }

  // If we have no filter (IE "all" is our curr route), we already know there are files, so its fine
  if (curr_target === null) {
    return "ok";
  }
  // We have a filter: check it's valid
  else {
    if (data.allFiles.some(f => f.unique_id === curr_target)) {
      // This file exists
      return "ok";
    } else {
      // Just go to first in list
      return data.allFiles[0].unique_id;
    }
  }
}
