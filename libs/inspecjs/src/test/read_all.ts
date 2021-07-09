// Get filesystem
import * as fs from 'fs';
import {ConversionResult, convertFile} from '../fileparse';
import {ControlStatus, HDFControl, hdfWrapControl} from '../inspecjs';
import {ExecJSON} from '../versions/v_1_0';

type Counts = {[key in ControlStatus]: number};

export const inspecJSFunctions = {
  /** Instantiates a counts objects with all keys set to 0 */
  new_count: (): Counts => {
    return {
      'From Profile': 0,
      'Not Applicable': 0,
      'Not Reviewed': 0,
      'Profile Error': 0,
      Failed: 0,
      Passed: 0
    };
  },

  /** Counts all of the statuses in a list of hdf controls */
  count_hdf: (controls: HDFControl[]): Counts => {
    const result = inspecJSFunctions.new_count();
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
    controls = inspecJSFunctions.filter_overlays(controls);
    return inspecJSFunctions.count_hdf(controls);
  },

  // Formats the status counts
  format_count: (c: Counts): string => {
    return `\
      Passed          : ${c.Passed}\n\
      Failed          : ${c.Failed}\n\
      Not Applicable  : ${c['Not Applicable']}\n\
      Not Reviewed    : ${c['Not Reviewed']}\n\
      Profile Error   : ${c['Profile Error']}`;
  }
}

// function readFiles(
//   dirname: string,
//   onFileContent: (filename: string, content: string) => void
// ): void {
//   fs.readdir(dirname, function(err, filenames) {
//     if (err) {
//       console.log(`Error reading dir ${dirname}`);
//       console.log(err);
//       return;
//     }
//     // Sort the filenames
//     filenames = filenames.sort();

//     filenames.forEach(function(filename) {
//       try {
//         const content = fs.readFileSync(dirname + filename, "utf-8");
//         onFileContent(filename, content);
//       } catch (err) {
//         console.log(`Error reading file ${filename}`);
//         console.log(err);
//       }
//     });
//   });
// }

// readFiles("parse_testbed/", (fn, content) => {
//   console.log(`Reading file ${fn}`);

//   // Convert it
//   let result: ConversionResult;
//   try {
//     result = convertFile(content);
//   } catch (e) {
//     console.error(
//       new Error(`Failed to convert file ${fn} due to error "${e}".`)
//     );
//     return;
//   }

//   // See if any success
//   if (result["1_0_ExecJson"]) {
//     console.log(`X`);
//     console.log(inspecJSFunctions.format_count(inspecJSFunctions.count_exec_1_0(result["1_0_ExecJson"])));
//   } else if (result["1_0_ExecJsonMin"]) {
//     console.log(`File ${fn} is a minimized execution`);
//   } else if (result["1_0_ProfileJson"]) {
//     console.log(`File ${fn} is a profile.`);
//   } else {
//     console.log(`File ${fn} did not produce a valid output`);
//   }
//   console.log("--------------------------------------------");
// });
