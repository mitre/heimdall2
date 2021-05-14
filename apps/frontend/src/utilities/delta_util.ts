/**
 * Provides utlities for comparing executions
 */

import {SourcedContextualizedEvaluation} from '@/store/report_intake';
import {context} from 'inspecjs';
import {DateTime} from 'luxon';

export const NOT_SELECTED = 'not selected';

// Unique ID is the unique ID of a file
// Controls is a list of controls
interface ResultControls {
  unique_id: string;
  controls: context.ContextualizedControl[];
}

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
    this.changes = this.changes.filter((c) => c.valid);
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
    const header_changes: ControlChange[] = [];

    // Change in... ID? Theoretically possible!
    header_changes.push(
      new ControlChange(
        'ID',
        this.controlsandnull.map((c) => {
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
        this.controlsandnull.map((c) => {
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
        this.controlsandnull.map((c) => {
          if (c === null) {
            return NOT_SELECTED;
          }
          return c!.hdf.raw_nist_tags.join(', ');
        })
      )
    );

    // Make the group and clean it
    const result = new ControlChangeGroup('Control Details', header_changes);
    result.clean();
    return result;
  }
}

// EvaluationInfo keeps files as a Profile when they are really an Evaluation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function get_eval_start_time(ev: any): string | null {
  if (ev) {
    for (const prof of ev.contains) {
      if (prof.contains) {
        for (const ctrl of prof.contains) {
          if (ctrl.hdf.segments!.length) {
            return ctrl.hdf.segments![0].start_time;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Grabs the "top" (IE non-overlayed/end of overlay chain) controls from the execution.
 *
 * @param exec The execution to grab controls from
 */
function extract_top_level_controls(
  exec: SourcedContextualizedEvaluation
): ResultControls {
  // Get all controls
  const allControls = exec.contains.flatMap((p) => p.contains);

  // Filter to controls that aren't overlayed further
  const top = allControls.filter((control) => control.extended_by.length === 0);
  return {unique_id: exec.from_file.unique_id, controls: top};
}
/** An object of contextualized controls with the same V-ID */
export type ControlSeries = {[key: string]: context.ContextualizedControl};

/** Matches ControlID keys to Arrays of Controls */
export type ControlSeriesLookup = {[key: string]: ControlSeries};

/** Helps manage comparing change(s) between one or more profile executions */
export class ComparisonContext {
  /** A list of old-new control pairings */
  pairings: ControlSeriesLookup;

  constructor(executions: readonly SourcedContextualizedEvaluation[]) {
    // Get all of the "top level" controls from each execution, IE those that actually ran
    // grouped by their files unique id.
    const allControls = executions.map(extract_top_level_controls);
    // Organize the controls by ID
    // The structure this returns is as follows:
    // {{"V-XXX": {"unique_file_id_1": control, "unique_file_id_2": control, ...}}}
    const matched = allControls.reduce(
      (acc: ControlSeriesLookup, evaluation: ResultControls) => {
        evaluation.controls.forEach((control) => {
          // Group initialization
          if (!acc[control.data.id]) {
            acc[control.data.id] = {};
          }
          // Grouping
          acc[control.data.id][evaluation.unique_id] = control;
        });

        return acc;
      },
      {}
    );
    // Store
    this.pairings = matched;
  }
}

/*
  DateTime parsing in Chrome works very different than Safari and Firefox
  Using luxon provides consistent timestamp information with a fallback to
  using the native browser date parsing.

  Chrome already supports parsing all of these formats natively, however it
  is the only browser that does so.
*/
export function parse_datetime(dateString: string): DateTime {
  let result: DateTime;

  result = DateTime.fromRFC2822(dateString);
  if (result.isValid) {
    return result;
  }
  result = DateTime.fromISO(dateString);
  if (result.isValid) {
    return result;
  }
  result = DateTime.fromHTTP(dateString);
  if (result.isValid) {
    return result;
  }
  result = DateTime.fromSQL(dateString);
  if (result.isValid) {
    return result;
  }

  return DateTime.fromJSDate(new Date(dateString));
}

export function compare_times(
  a: SourcedContextualizedEvaluation,
  b: SourcedContextualizedEvaluation
) {
  const aDate = parse_datetime(get_eval_start_time(a) || '');
  const bDate = parse_datetime(get_eval_start_time(b) || '');

  return aDate.valueOf() - bDate.valueOf();
}
