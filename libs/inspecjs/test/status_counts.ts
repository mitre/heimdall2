// Get filesystem
import { type ControlStatus, type HDFControl, hdfWrapControl } from '../src';
import { type ExecJSON } from '../src/versions/v_1_0';

type Counts = Record<ControlStatus, number>;

export const statusCounts = {
  count_exec_1_0: (x: ExecJSON.Execution): Counts => {
    let controls: HDFControl[] = [];
    // Get all controls
    for (const p of x.profiles) {
      controls.push(...p.controls.map(c => hdfWrapControl(c)))
      ;
    }
    // Filter overlays
    controls = statusCounts.filter_overlays(controls);
    return statusCounts.count_hdf(controls);
  },

  /** Counts all of the statuses in a list of hdf controls */
  count_hdf: (controls: HDFControl[]): Counts => {
    const result = statusCounts.new_count();
    for (const c of controls) {
      result[c.status] += 1;
    }
    return result;
  },

  /** Trivial overlay filter that just takes the version of the control that has results from amongst all identical ids */
  filter_overlays: (controls: HDFControl[]): HDFControl[] => {
    const idHash: Record<string, HDFControl> = {};
    for (const c of controls) {
      const id = c.wraps.id;
      const old: HDFControl | undefined = idHash[id];
      // If old, gotta check if our new status list is "better than" old
      if (old) {
        const newSignificant = c.status_list && c.status_list.length > 0;
        if (newSignificant) {
          // Overwrite
          idHash[id] = c;
        }
      } else {
        // First time seeing this id
        idHash[id] = c;
      }
    }

    // Return the set of keys
    return Array.from(Object.values(idHash));
  },

  /** Instantiates a counts objects with all keys set to 0 */
  new_count: (): Counts => {
    return {
      Failed: 0,
      'From Profile': 0,
      'Not Applicable': 0,
      'Not Reviewed': 0,
      Passed: 0,
      'Profile Error': 0,
    };
  },
};
