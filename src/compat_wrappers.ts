import { ExecJSONControl as ResultControl_1_0 } from "./generated_parsers/exec-json";
import { ProfileJSONControl as ProfileControl_1_0 } from "./generated_parsers/profile-json";
import {
    ProfileControl as HDFProfileControl_1_0,
    ExecControl as HDFExecControl_1_0,
} from "./compat_impl/compat_inspec_1_0";
import * as parsetypes from "./fileparse";
import { NistControl, NistRevision } from "./nist";

// These types are used throughout for control/result status and impact

/**
 * The statuses that a control might have.
 *
 * This is computed as follows:
 * 1. any kind of error -> "Profile Error"
 * 2. impact 0 -> "Not Applicable" (except if #1)
 * 3. has any failed tests -> "Failed" (except if #1 or #2)
 * 4. has skip and pass -> "Passed" (except if #1 or #2)
 * 5. all tests within a control pass -> "Passed" (except if #1 or #2)
 * 6. only skips -> Requires Manual Review (except if #1 or #2)
 * 7. No data at all (but from exec) -> "Profile Error"
 * 8. from profile -> "From Profile"
 * These cases are in theory comprehensive, but if somehow no apply, it is still Profile Error
 */
export type ControlStatus =
    | "Not Applicable"
    | "From Profile"
    | "Profile Error"
    | "Passed"
    | "Failed"
    | "Not Reviewed";

/** The severities a control can have. These map numeric impact values to No/Low/Medium/High/Crtiical impact
 * [0, 0.01) => No impact
 * [0.01, 0.4) => Low impact
 * [0.4, 0.7) => Medium impact
 * [0.7, 0.9) => High impact
 * [0.9, 1.0] => Critical impact
 */
export type Severity = "none" | "low" | "medium" | "high" | "critical";

/** The statuses that a segment of a control (IE a describe block) might have. */
export type SegmentStatus =
    | "passed"
    | "failed"
    | "skipped"
    | "error"
    | "no_status";

/**
 * This interface acts as a polyfill on controls for our HDF "guaranteed" derived types, to provide a stable
 * method for acessing their properties across different schemas.
 */
export interface HDFControl {
    /**
     * The control that this interface wraps
     */
    wraps: parsetypes.AnyFullControl;

    /**
     * Get the control status as computed for the entire control.
     * See the below for discussion of how this should be computed.
     * https://github.com/mitre/heimdall-vuetify/issues/57
     */
    status: ControlStatus;

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
     * If they don't, simply returns empty array.
     * If you want auto resolving, use fixed_nist_tags
     */
    raw_nist_tags: string[];

    /**
     * Returns a user-facing representation of the result of this status, consisting of a message explaining
     * this controls status, followed by the contents of this.message.
     */
    finding_details: string;

    /**
     * Returns the nist tags parsed and filtered to only include valid tags.
     * If unmapped, will be effectively UM-1.
     * Sorted lexicographically, first by family, then by corresponding sub-specifiers.
     */
    parsed_nist_tags: NistControl[];

    /**
     * Returns the revision of the nist tags, if it was found.
     */
    parsed_nist_revision: NistRevision | null;

    /** Get the start time of this control's run, as determiend by the time of the first test.
     * If no tests were run, (it is a profile-json or has no tests) returns undefined
     */
    start_time?: string;

    /** Get the results of this control's control segments  as a list.
     * If no tests were run, (this is a profile-json) returns undefined.
     * Can be empty in the rare case that no control segments exist/were run.
     */
    status_list?: SegmentStatus[];

    /**
     * Access the segments of this control in HDF format.
     * If no tests were run, (this is a profile-json) returns undefined.
     */
    segments?: HDFControlSegment[];

    /** Easy check if this is a profile */
    is_profile: boolean;

    /** Maps string labels to description items. */
    descriptions: { [key: string]: string };

    /** Returns whether this control was waived. */
    waived: boolean;
}

/**
 * Represents a single describe blocks execution in our test,
 * and data related to its execution
 */
export interface HDFControlSegment {
    /** The result of this particular segment */
    status: SegmentStatus;

    /** The message that inspec produced describing this segment's result */
    message?: string;

    /** The description of this particular segment */
    code_desc: string;

    /** A message describing why this segment was skipped (if it was skipped) */
    skip_message?: string;

    /** A string describing the error/exception this segment encountered (if one was encountered) */
    exception?: string;

    /** A line by line trace of where this.exception occurred */
    backtrace?: string[];

    /** The start time of this segment, which is typically in the format.
     *
     * yyyy-mm-ddThh:mm:ss+|-HH:MM
     *
     * Where yyyy is year, mm d=month, dd day, hh hour, mm minute, ss second,
     * plus or minus HH:MM s the time zone offset.
     * 
     * However, this isn't guaranteed
     */
    start_time: string;

    /** The run time of this segment, in seconds */
    run_time?: number;

    /** Which inspec resource this control used, if one could be determined */
    resource?: string;
}

/**
 * Wrapper to guarantee certain HDF properties on a control, or at least provide
 * type safed accessors.
 *
 * @param ctrl The control to polyfill
 */
export function hdfWrapControl(ctrl: parsetypes.AnyFullControl): HDFControl {
    // Determine which schema it is
    if ((ctrl as ResultControl_1_0).results !== undefined) {
        let rctrl = ctrl as ResultControl_1_0;
        return new HDFExecControl_1_0(rctrl);
    } else {
        let rctrl = ctrl as ProfileControl_1_0;
        return new HDFProfileControl_1_0(rctrl);
    }

    // In theory future schemas will be easier to decipher because of a version tag
    throw new Error("Control did not match any expected schema");
}
