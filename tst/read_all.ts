// Get filesystem
import * as fs from "fs";
import * as path from "path";
import { ConversionResult, convertFile } from "../src/fileparse";
import { ControlStatus, hdfWrapControl, HDFControl } from "../src/inspecjs";
import { ExecJSONMin, ExecJSON } from "../src/versions/v_1_0";

/** Reads the contents of the given files into an array of strings. */
function readFiles(
    dirname: string,
    onFileContent: (filename: string, content: string) => void
) {
    fs.readdir(dirname, function(err, filenames) {
        if (err) {
            console.log(`Error reading dir ${dirname}`);
            console.log(err);
            return;
        }
        filenames.forEach(function(filename) {
            fs.readFile(dirname + filename, "utf-8", function(err, content) {
                if (err) {
                    console.log(`Error reading file ${filename}`);
                    console.log(err);
                    return;
                }
                onFileContent(filename, content);
            });
        });
    });
}

type Counts = { [key in ControlStatus]: number };
/** Instantiates a counts object with all keys set to 0 */
function new_count(): Counts {
    return {
        "From Profile": 0,
        "Not Applicable": 0,
        "Not Reviewed": 0,
        "Profile Error": 0,
        "Failed": 0,
        "Passed": 0,
    };
}

/** Counts all of the statuses in a list of hdf controls */
function count_hdf(controls: HDFControl[]): Counts {
    let result = new_count();
    controls.forEach(c => {
        result[c.status] += 1;
    });
    return result;
}

/** Trivial overlay filter that just takes the version of the control that has results from amongst all identical ids */
function filter_overlays(controls: HDFControl[]): HDFControl[] {
    let id_hash: { [key: string]: HDFControl } = {};
    controls.forEach(c => {
        let id = c.wraps.id;
        let old: HDFControl | undefined = id_hash[id];
        // If old, gotta check if our new status list "better than" old
        if (old) {
            let new_significant = c.status_list && c.status_list.length > 0;
            if (new_significant) {
                // Overwrite
                id_hash[id] = c;
            }
        } else {
            // First time seeing this id
            id_hash[id] = c;
        }
    });

    // Return the set keys
    return Array.from(Object.values(id_hash));
}

function count_exec_1_0(x: ExecJSON.Execution): Counts {
    let result = new_count();
    let controls: HDFControl[] = [];
    // Get all controls
    x.profiles.forEach(p =>
        controls.push(...p.controls.map(c => hdfWrapControl(c)))
    );
    // Filter overlays
    controls = filter_overlays(controls);

    // Count
    return count_hdf(controls);
}

function format_count(c: Counts) {
    return `\
    Passed          : ${c.Passed}\n\
    Failed          : ${c.Failed}\n\
    Not Applicable  : ${c["Not Applicable"]}\n\
    Not Reviewed    : ${c["Not Reviewed"]}\n\
    Profile Error   : ${c["Profile Error"]}`;
}

readFiles("tst/parse_testbed/", (fn, content) => {
    console.log(`Reading file ${fn}`);

    // Convert it
    let result: ConversionResult;
    try {
        result = convertFile(content);
    } catch (e) {
        console.error(
            new Error(`Failed to convert file ${fn} due to error "${e}".`)
        );
        return;
    }

    // See if any success
    if (result["1_0_ExecJson"]) {
        console.log(`File ${fn} is an execution`);
        console.log(format_count(count_exec_1_0(result["1_0_ExecJson"])));
    } else if (result["1_0_ExecJsonMin"]) {
        console.log(`File ${fn} is a minimized execution`);
    } else if (result["1_0_ProfileJson"]) {
        console.log(`File ${fn} is a profile.`);
    } else {
        console.log(`File ${fn} did not produce a valid output`);
    }
    console.log("--------------------------------------------");
});
