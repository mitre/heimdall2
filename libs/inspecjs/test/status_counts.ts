// Get filesystem
import {ControlStatus, HDFControl, hdfWrapControl} from '../src';
import {ExecJSON} from '../src/versions/v_1_0';

type Counts = {[key in ControlStatus]: number};

export const statusCounts = {
  /** Instantiates a counts objects with all keys set to 0 */
  new_count: (): Counts => {
    return {
      'From Profile': 0,
      'Not Applicable': 0,
      'Not Reviewed': 0,
      'Profile Error': 0,
      'Pending': 0,
      Failed: 0,
      Passed: 0
    };
  },

  /** Counts all of the statuses in a list of hdf controls */
  count_hdf: (controls: HDFControl[]): Counts => {
    const result = statusCounts.new_count();
    controls.forEach((c) => {
      result[c.status] += 1;
    });
    return result;
  },

  /** Trivial overlay filter that just takes the version of the control that has results from amongst all identical ids */
  filter_overlays: (controls: HDFControl[]): HDFControl[] => {
    const idHash: {[key: string]: HDFControl} = {};
    controls.forEach((c) => {
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
    });

    // Return the set of keys
    return Array.from(Object.values(idHash));
  },

  count_exec_1_0: (x: ExecJSON.Execution): Counts => {
    let controls: HDFControl[] = [];
    // Get all controls
    x.profiles.forEach((p) =>
      controls.push(...p.controls.map((c) => hdfWrapControl(c)))
    );
    // Filter overlays
    controls = statusCounts.filter_overlays(controls);
    return statusCounts.count_hdf(controls);
  }
};
