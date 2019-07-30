import { ExecJSONControl as ResultControl_1_0 } from "./generated-parsers/exec-json";
import { ProfileJSONControl as ProfileControl_1_0 } from "./generated-parsers/profile-json";
import * as parsetypes from "./fileparse";
import { setFlagsFromString } from "v8";

// These types are used throughout for control/result status and impact

/**
 * The statuses that a control might have.
 *
 * This is computed as follows:
 * If the profile has 0 impact, it is "Not Applicable"
 * Else, if it contains a "failed" amidst its status list, it is "Failed"
 * Else, if it contains a "passed" amidst its status list, it is "Passed"
 * Else, if it contains a "skipped" amidst its status list, it is "Not Reviewed"
 * Else, there are no results, and so the profile is marked as "Profile Error".
 *
 * Note that as currently implemented, this implies that a control that has not been run is an "Error".
 * TODO: Make this more clear? Add another status?
 */
export type ControlStatus =
    | "From Profile"
    | "Passed"
    | "Failed"
    | "Not Applicable"
    | "Not Reviewed"
    | "Profile Error";

/** The severities a control can have. These map numeric impact values to No/Low/Medium/High/Crtiical impact
 * [0, 0.01) => No impact
 * [0.01, 0.4) => Low impact
 * [0.4, 0.7) => Medium impact
 * [0.7, 0.9) => High impact
 * [0.9, 1.0] => Critical impact
 */
export type Severity = "none" | "low" | "medium" | "high" | "critical";

/** The statuses that a PART of a control (IE a describe block) might have. */
export type ResultStatus = "passed" | "failed" | "skipped" | "error";

/**
 * This interface acts as a polyfill on controls for our HDF "guaranteed" derived types, to provide a stable
 * method for acessing their properties
 */
export interface HDFControl {
    // Guaranteed
    id: string;
    /**
     * Get the control status as computed for the entire control.
     */
    status: ControlStatus;
    /**
     * TODO: Document whatever the hell this actually is
     */
    vuln_num: string;
    severity: Severity;
    /**
     * A string that essentially acts as a user-facing log of the results of the success/failure of each
     * part of the control's code.
     * This variable is UNSTABLE and should not be used as a ground-truth for testing, as it's format may be changed
     * in the future.
     */
    message: string;

    // May be present depending on type of input
    /**
     * Returns the nist tags if they exist.
     */
    nist_tags?: string[];

    /**
     * Returns a user-facing representation of the result of this status, consisting of a message explaining
     * this controls status, followed by the contents of this.message.
     */
    finding_details: string;


    /**
     * Returns the nist tags with any extraneous/duplicate data (Rev4, (b), etc.) removed,
     * sorted alphabetically
     */
    fixed_nist_tags?: string[];

    /** Get the start time of this control's run, as determiend by the time of the first test.
     * If no tests were run, (it is a profile-json or has no tests) returns undefined
     */
    start_time?: string;

    /** Get the results of this control's `describe` blocks as a list.
     * If no tests were run, (it is a profile-json or has no tests) returns undefined
     */
    status_list?: ResultStatus[];
}

/**
 * Wrapper to guarantee HDF properties on a control
 *
 * TODO: Figure out if/how we want to error out when a polyfill is impossible
 * @param ctrl The control to polyfill
 */
export function wrapHDFFormat(ctrl: parsetypes.AnyFullControl): HDFControl {
    // Determine which schema it is
    if ((ctrl as ResultControl_1_0).results !== undefined) {
        let rctrl = ctrl as ResultControl_1_0;
        return new HDFControl_1_0_Exec(rctrl);
    } else {
        let rctrl = ctrl as ProfileControl_1_0;
        return new HDFControl_1_0_Profile(rctrl);
    }

    // In theory future schemas will be easier to decipher because of a version tag
    //throw "Error: Control did not match any expected schema";
}

// V 1.0 implementation
// Much behaviour is shared between the two classes, and so we use a singular superclass to handle
import { ControlResult as ControlResult_1_0 } from "./generated-parsers/exec-json";
abstract class HDFControl_1_0 implements HDFControl {
    // We use this as a reference
    base: ResultControl_1_0 | ProfileControl_1_0;
    constructor(forControl: ResultControl_1_0 | ProfileControl_1_0) {
        this.base = forControl;
    }

    // Helper for turning control results into strings
    static toMessageLine(r: ControlResult_1_0): string {
        switch (r.status) {
            case "skipped":
                return `SKIPPED -- ${r.skip_message}\n`;
            case "failed":
                return `FAILED -- Test: ${r.code_desc}\nMessage: ${
                    r.message
                }\n`;
            case "passed":
                return `PASSED -- ${r.code_desc}\n"`;
            case "error":
                return `ERROR -- Test: ${r.code_desc}\nMessage: ${r.message}`;
            default:
                return `Exception: ${r.exception}\n`;
        }
    }

    // Abstracts
    abstract get message(): string;

    // Delegates
    get id(): string {
        return this.base.id;
    }

    get nist_tags(): string[] | undefined {
        return this.base.tags["nist"];
    }

    /**
     * TODO: Document
     */
    get vuln_num(): string {
        // We truncate the id based up to its first decimal (as far as I can tell - update later)
        if (this.base.id.match(/\d+\.\d+/)) {
            let match = this.vuln_num.match(/\d+(\.\d+)*/);
            if (match) {
                return match[0];
            }
        }
        return this.base.id;
    }

    get finding_details(): string {
        let result = "";
        switch (this.status) {
            case "Failed":
                return `One or more of the automated tests failed or was inconclusive for the control:\n\n${
                    this.message
                }\n`;
            case "Passed":
                return `All Automated tests passed for the control:\n\n${
                    this.message
                }\n`;
            case "Not Reviewed":
                return `Automated test skipped due to known accepted condition in the control:\n\n${
                    this.message
                }\n`;
            case "Not Applicable":
                return `Justification:\n\n${this.message}\n`;
            case "Profile Error":
                if (this.message) {
                    return `Exception:\n\n${this.message}\n`;
                } else {
                    return `No test available for this control.`;
                }
            case "From Profile":
                return "No tests are run in a profile json."

            default:
                throw "Error: invalid status generated";
        }
    }

    get status(): ControlStatus {
        if (this.status_list.includes("error")) {
            return "Profile Error";
        } else {
            if (this.base.impact == 0) {
                return "Not Applicable";
            } else if (this.status_list.includes("failed")) {
                return "Failed";
            } else if (this.status_list.includes("passed")) {
                return "Passed";
            } else if (this.status_list.includes("skipped")) {
                return "Not Reviewed";
            } else {
                return "Profile Error";
            }
        }
    }

    get severity(): Severity {
        if (this.base.impact < 0.1) {
            return "none";
        } else if (this.base.impact < 0.4) {
            return "low";
        } else if (this.base.impact < 0.7) {
            return "medium";
        } else if (this.base.impact < 0.9) {
            return "high";
        } else {
            return "critical";
        }
    }

    get status_list(): ResultStatus[] {
        throw "aaaah";
        // return this.base.results.map(r => r.status);
    }
}

class HDFControl_1_0_Exec extends HDFControl_1_0 implements HDFControl {
    constructor(control: ResultControl_1_0) {
        super(control);
    }

    // Helper to cast
    private get rbase(): ResultControl_1_0 {
        return this.base as ResultControl_1_0;
    }

    get message(): string {
        if (this.base.impact != 0) {
            // If it has any impact, convert each result to a message line and chain them all together
            return this.rbase.results
                .map(HDFControl_1_0.toMessageLine)
                .join("");
        } else {
            // If it's no impact, just post the description (if it exists)
            return this.base.desc || "No message found.";
        }
    }

    get start_time(): string | undefined {
        if (this.rbase.results) {
            return this.rbase.results[0].start_time;
        }
        return undefined;
    }
}

class HDFControl_1_0_Profile extends HDFControl_1_0 implements HDFControl {
    constructor(control: ProfileControl_1_0){
        super(control);
    }

    get message(): string {
        // If it's no impact, just post the description (if it exists)
        return this.base.desc || "No message found.";
    }
}