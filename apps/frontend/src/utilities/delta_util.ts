/**
 * Provides utlities for comparing executions
 */

import { SourcedContextualizedEvaluation } from "@/store/data_store";
import { HDFControlSegment, context } from "inspecjs";
import {
  structuredPatch,
  createPatch,
  diffArrays,
  Change as DiffChange,
  diffJson
} from "diff";

/**
 * Represents a change in a property.
 * We assume that the "old" property is the name to use for both.
 * IE that they are the same property value.
 */
export class ControlChange {
  name: string;
  old: string;
  new: string;

  /** Trivial constructor */
  constructor(name: string, old: string, new_: string) {
    this.name = name;
    this.old = old;
    this.new = new_;
  }

  /** Checks if this actually changes anything.
   * Returns true iff old !== new
   */
  get valid(): boolean {
    return this.old !== this.new;
  }
}

/**
 * Represents a group of changes all under one cnosistent named banner.
 */
export class ControlChangeGroup {
  name: string;
  changes: ControlChange[];

  /** Trivial constructor */
  constructor(name: string, changes: ControlChange[]) {
    this.name = name;
    this.changes = changes;
  }

  /** Checks if this has any changes at all. Simple shorthand */
  get any(): boolean {
    return this.changes.length > 0;
  }

  /** Removes any changes if they aren't actually changes */
  clean() {
    this.changes = this.changes.filter(c => c.valid);
  }
}

/** Combines two hashes into a series of changes.
 * If any keys are missing from the first/second, they are treated as the empty string.
 * Note that these "changes" might not necessarily be valid.
 */
function changelog_segments(
  old: HDFControlSegment,
  new_: HDFControlSegment
): ControlChange[] {
  // Get all the keys we care about
  let all_keys: Array<
    "code_desc" | "status" | "message" | "resource" | "exception"
  >;
  all_keys = ["status", "code_desc", "exception", "message", "resource"]; // determines output order, which are displayed, etc.

  // Map them to changes
  let changes: ControlChange[] = [];
  all_keys.forEach(key => {
    let ov: string = old[key] || "";
    let nv: string = new_[key] || "";
    changes.push(new ControlChange(key, ov, nv));
  });

  return changes;
}

/**
 * Holds/computes the differences between two runs of the same control.
 */
export class ControlDelta {
  /** The older control */
  old: context.ContextualizedControl;

  /** The newer control */
  new: context.ContextualizedControl;

  constructor(
    old: context.ContextualizedControl,
    _new: context.ContextualizedControl
  ) {
    this.old = old;
    this.new = _new;
  }

  /* More specific deltas we handle as getters, so that they are only generated on-demand by vue */

  /** Compute the diff in lines-of-code  */
  get code_changes(): ControlChangeGroup {
    let old_code = this.old.data.code || "";
    let new_code = this.old.data.code || "";

    // Compute the changes in the lines
    let line_diff = structuredPatch(
      "old_filename",
      "new_filename",
      old_code,
      new_code
    );

    // Convert them to change objects
    let changes: ControlChange[] = line_diff.hunks.map(hunk => {
      // Find the original line span
      let lines = `line ${hunk.oldStart} - ${hunk.oldStart + hunk.oldLines}`;

      // Form the complete chunks
      let o = hunk.lines
        .filter(l => l[0] !== "+")
        .map(l => l.substr(1))
        .join("\n");
      let n = hunk.lines
        .filter(l => l[0] !== "-")
        .map(l => l.substr(1))
        .join("\n");
      return new ControlChange(lines, o, n);
    });

    // Clean and return the result
    let result = new ControlChangeGroup("Code", changes);
    result.clean();
    return result;
  }

  /** Returns the changes in "header" elements of a control. E.g. name, status, etc. */
  get header_changes(): ControlChangeGroup {
    // Init the list
    let header_changes: ControlChange[] = [];

    // Change in... ID? Theoretically possible!
    header_changes.push(
      new ControlChange("Status", this.old.data.id, this.new.data.id)
    );

    // Change in status, obviously.
    header_changes.push(
      new ControlChange(
        "Status",
        this.old.root.hdf.status,
        this.new.root.hdf.status
      )
    );

    // And severity! Why not
    header_changes.push(
      new ControlChange(
        "Severity",
        this.old.root.hdf.severity,
        this.new.root.hdf.severity
      )
    );

    // Change in nist tags!
    header_changes.push(
      new ControlChange(
        "NIST Tags",
        this.old.root.hdf.raw_nist_tags.join(", "),
        this.new.root.hdf.raw_nist_tags.join(", ")
      )
    );

    // Make the group and clean it
    let result = new ControlChangeGroup("Control Details", header_changes);
    result.clean();
    return result;
  }

  /**
   * Get the changes in the controls individual segments.
   * They are returned as a list of change groups, with each group encoding a segment.
   */
  get segment_changes(): ControlChangeGroup[] {
    // Change in individual control segments
    let old_segs = this.old.root.hdf.segments;
    let new_segs = this.new.root.hdf.segments;
    if (old_segs === undefined || new_segs === undefined) {
      // Oh well
      return [];
    }

    // Pair them by position. Crude but hopefully fine
    // Abort if they aren't the same length
    if (old_segs.length !== new_segs.length) {
      console.warn("Unable to match control segments for delta");
      return [];
    }

    // Do the actual pairing/diff fingind
    let results: ControlChangeGroup[] = [];
    for (let i = 0; i < old_segs.length; i++) {
      let old_seg = old_segs[i];
      let new_seg = new_segs[i];
      let changes = changelog_segments(old_seg, new_seg);
      let group = new ControlChangeGroup(old_seg.code_desc, changes);

      // Clean it up and store if not empty
      group.clean();
      if (group.any) {
        results.push(group);
      }
    }

    return results;
  }
}

/**
 * Grabs the "top" (IE non-overlayed/end of overlay chain) controls from the execution.
 *
 * @param exec The execution to grab controls from
 */
function extract_top_level_controls(
  exec: context.ContextualizedEvaluation
): context.ContextualizedControl[] {
  // Get all controls
  let all_controls = exec.contains.flatMap(p => p.contains);

  // Filter to controls that aren't overlayed further
  let top = all_controls.filter(control => control.extended_by.length === 0);
  return top;
}

/** Matches ControlID keys to Arrays of Controls, sorted by time */
type MatchedControls = { [key: string]: Array<context.ContextualizedControl> };

/** Helps manage comparing change(s) between one or more profile executions */
export class ComparisonContext {
  /** A list of old-new control pairings */
  pairings: MatchedControls;

  constructor(executions: readonly context.ContextualizedEvaluation[]) {
    // Get all of the "top level" controls from each execution, IE those that actually ran
    let all_controls = executions.flatMap(extract_top_level_controls);

    // Organize them by ID
    let matched: MatchedControls = {};
    all_controls.forEach(ctrl => {
      let id = ctrl.data.id;

      // Group them up
      if (id in matched) {
        matched[id].push(ctrl);
      } else {
        matched[id] = [ctrl];
      }

      // Sort them by start time
      Object.values(matched).forEach(ctrl_list =>
        ctrl_list.sort(
          (
            a: context.ContextualizedControl,
            b: context.ContextualizedControl
          ) => {
            // TODO: Move this to a more stable, external library based solution
            // TODO: Create a method for getting the start time of an execution, and instead do this sort on executions at the start
            // Convert to dates, and
            let a_date = new Date(a.root.hdf.start_time || 0);
            let b_date = new Date(b.root.hdf.start_time || 0);
            return a_date.valueOf() - b_date.valueOf();
          }
        )
      );
    });

    // Store
    this.pairings = matched;
  }
}
