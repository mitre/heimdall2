/**
 * Provides utlities for comparing executions
 */

import {context} from 'inspecjs';
import {EvaluationFile} from '@/store/report_intake';
import {ContextualizedEvaluation} from 'inspecjs/dist/context';

export const NOT_SELECTED = 'not selected';

/**
 * Represents a change in a property.
 * We assume that the "old" property is the name to use for both.
 * IE that they are the same property value.
 */
export class ControlChange {
  name: string; // the key/title of these values
  values: string[]; // values over controls sorted by time

  /** Trivial constructor */
  constructor(name: string, values: string[]) {
    this.values = values;
    this.name = name;
  }

  /** Checks if this actually changes anything.
   * Returns true iff old !== new
   */
  get valid(): boolean {
    let first_selected = -1;
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] != NOT_SELECTED) {
        first_selected = i;
        break;
      }
    }
    if (first_selected == -1) {
      return false;
    }
    for (let i = first_selected + 1; i < this.values.length; i++) {
      if (
        this.values[i] != this.values[first_selected] &&
        this.values[i] != NOT_SELECTED
      ) {
        return true;
      }
    }
    return false;
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

/**
 * Holds/computes the differences between two runs of the same control.
 */
export class ControlDelta {
  controls: context.ContextualizedControl[] = [];
  controlsandnull: (context.ContextualizedControl | null)[] = [];
  numNull: number = 0;

  constructor(controls: (context.ContextualizedControl | null)[]) {
    this.controlsandnull = controls;
    for (let i = 0; i < controls.length; i++) {
      if (controls[i] === null) {
        this.numNull += 1;
      } else {
        this.controls.push(controls[i]!);
      }
    }
  }

  /** Returns the changes in "header" elements of a control. E.g. name, status, etc. */
  get header_changes(): ControlChangeGroup {
    // Init the list
    let header_changes: ControlChange[] = [];

    // Change in... ID? Theoretically possible!
    header_changes.push(
      new ControlChange(
        'ID',
        this.controlsandnull.map(c => {
          if (c === null) {
            return NOT_SELECTED;
          }
          return c!.data.id;
        })
      )
    );

    // And severity! Why not
    header_changes.push(
      new ControlChange(
        'Severity',
        this.controlsandnull.map(c => {
          if (c === null) {
            return NOT_SELECTED;
          }
          return c!.hdf.severity;
        })
      )
    );

    // Change in nist tags!
    header_changes.push(
      new ControlChange(
        'NIST Tags',
        this.controlsandnull.map(c => {
          if (c === null) {
            return NOT_SELECTED;
          }
          return c!.hdf.raw_nist_tags.join(', ');
        })
      )
    );

    // Make the group and clean it
    let result = new ControlChangeGroup('Control Details', header_changes);
    result.clean();
    return result;
  }
}

export function get_eval_start_time(
  ev: ContextualizedEvaluation
): string | null {
  for (let prof of ev.contains) {
    for (let ctrl of prof.contains) {
      if (ctrl.hdf.segments!.length) {
        return ctrl.hdf.segments![0].start_time;
      }
    }
  }
  return null;
}

export function sorted_evals(
  input_evals: Readonly<context.ContextualizedEvaluation[]>
): Readonly<context.ContextualizedEvaluation[]> {
  let evals = [...input_evals];
  evals = evals.sort((a, b) => {
    let a_date = new Date(get_eval_start_time(a) || 0);
    let b_date = new Date(get_eval_start_time(b) || 0);
    return a_date.valueOf() - b_date.valueOf();
  });
  return evals;
}

export function sorted_eval_files(
  files: Readonly<EvaluationFile[]>
): Readonly<EvaluationFile[]> {
  let fileArr = [...files];
  fileArr = fileArr.sort((a, b) => {
    let a_date = new Date(get_eval_start_time(a.evaluation) || 0);
    let b_date = new Date(get_eval_start_time(b.evaluation) || 0);
    return a_date.valueOf() - b_date.valueOf();
  });
  return fileArr;
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
/** An array of contextualized controls with the same ID, sorted by time */
export type ControlSeries = Array<context.ContextualizedControl | null>;

/** Matches ControlID keys to Arrays of Controls, sorted by time */
export type ControlSeriesLookup = {[key: string]: ControlSeries};

/** Helps manage comparing change(s) between one or more profile executions */
export class ComparisonContext {
  /** A list of old-new control pairings */
  pairings: ControlSeriesLookup;

  constructor(executions: readonly context.ContextualizedEvaluation[]) {
    // Get all of the "top level" controls from each execution, IE those that actually ran
    let all_controls = executions.flatMap(extract_top_level_controls);

    // Organize them by ID
    let matched: ControlSeriesLookup = {};
    for (let ctrl of all_controls) {
      let id = ctrl.data.id;
      if (!(id in matched)) {
        matched[id] = [];
      }
    }
    let sorted_eval: Readonly<context.ContextualizedEvaluation[]> = sorted_evals(
      executions
    );
    for (let ev of sorted_eval) {
      let ev_controls_by_id: {
        [k: string]: context.ContextualizedControl;
      } = {};
      for (let prof of ev.contains) {
        for (let ctrl of prof.contains) {
          if (ctrl.root == ctrl) {
            ev_controls_by_id[ctrl.data.id] = ctrl;
          }
        }
      }
      for (let id of Object.keys(matched)) {
        if (id in ev_controls_by_id) {
          matched[id].push(ev_controls_by_id[id]);
        } else {
          matched[id].push(null);
        }
      }
    }
    // Store
    this.pairings = matched;
  }
}
