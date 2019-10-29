/** Implementation for the "base" 1.0 inspec output schema
 * A lot of information/behaviour is shared between the profile and result version so we use a single abstract superclass
 */

import { ExecJSONControl as ResultControl_1_0 } from "../generated_parsers/exec-json";
import { ProfileJSONControl as ProfileControl_1_0 } from "../generated_parsers/profile-json";
import { ControlResult as ControlResult_1_0 } from "../generated_parsers/exec-json";

import {
    HDFControl,
    ControlStatus,
    Severity,
    SegmentStatus,
    HDFControlSegment,
} from "../compat_wrappers";
import { parse_nist, NistControl, NistRevision, is_control } from "../nist";

abstract class HDFControl_1_0 implements HDFControl {
    // We cache these here
    _parsed_nist_tags?: NistControl[];
    _parsed_nist_revision?: NistRevision | null;
    // We use this as a reference
    wraps: ResultControl_1_0 | ProfileControl_1_0;

    constructor(forControl: ResultControl_1_0 | ProfileControl_1_0) {
        this.wraps = forControl;
    }

    // Helper for turning control results into strings
    static toMessageLine(r: ControlResult_1_0): string {
        switch (r.status) {
            case "skipped":
                return `SKIPPED -- ${r.skip_message}\n`;
            case "failed":
                return `FAILED -- Test: ${r.code_desc}\nMessage: ${r.message}\n`;
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

    get raw_nist_tags(): string[] {
        let fetched: string[] | undefined | null = this.wraps.tags["nist"];
        if (!fetched) {
            return ["UM-1"];
        } else {
            return fetched;
        }
    }

    /** Generates the nist tags, as needed. */
    private parse_nist() {
        // Initialize
        this._parsed_nist_tags = [];
        this._parsed_nist_revision = null;
        let seen_specs = new Set<string>(); // Used to track duplication

        // Process item by item
        this.raw_nist_tags.map(parse_nist).forEach(x => {
            if (!x) {
                return;
            } else if (is_control(x)) {
                let spec_chain = x.sub_specifiers.join("-");
                if (!seen_specs.has(spec_chain)) {
                    seen_specs.add(spec_chain);
                    this._parsed_nist_tags!.push(x);
                }
            } else {
                this._parsed_nist_revision = x;
            }
        });

        // Sort the tags
        this._parsed_nist_tags = this._parsed_nist_tags.sort((a, b) =>
            a.localCompare(b)
        );

        // Stub if necessary
        if (this._parsed_nist_tags.length === 0) {
            this._parsed_nist_tags.push(parse_nist("UM-1") as NistControl);
        }
    }

    get parsed_nist_tags(): NistControl[] {
        if (this._parsed_nist_tags === undefined) {
            // Do the computations now, to save time later. These are fairly expensive
            this.parse_nist();
        }
        return this._parsed_nist_tags!;
    }

    get parsed_nist_revision(): NistRevision {
        if (this._parsed_nist_revision === undefined) {
            // Do the computations now, to save time later. These are fairly expensive
            this.parse_nist();
        }
        return this._parsed_nist_revision!;
    }

    get finding_details(): string {
        let result = "";
        switch (this.status) {
            case "Failed":
                return `One or more of the automated tests failed or was inconclusive for the control:\n\n${this.message}\n`;
            case "Passed":
                return `All Automated tests passed for the control:\n\n${this.message}\n`;
            case "Not Reviewed":
                return `Automated test skipped due to known accepted condition in the control:\n\n${this.message}\n`;
            case "Not Applicable":
                return `Justification:\n\n${this.message}\n`;
            case "Profile Error":
                if (!this.status_list || this.status_list.length === 0) {
                    return "No describe blocks were run in this control";
                } else if (this.message !== undefined) {
                    return `Exception:\n\n${this.message}\n`;
                } else {
                    return `No details available for this control.`;
                }
            case "From Profile":
                return "No tests are run in a profile json.";
            default:
                throw new Error("Error: invalid status generated");
        }
    }

    get severity(): Severity {
        if (this.wraps.impact < 0.1) {
            return "none";
        } else if (this.wraps.impact < 0.4) {
            return "low";
        } else if (this.wraps.impact < 0.7) {
            return "medium";
        } else if (this.wraps.impact < 0.9) {
            return "high";
        } else {
            return "critical";
        }
    }

    get status_list(): SegmentStatus[] | undefined {
        if (this.segments !== undefined) {
            return this.segments.map(s => s.status);
        }
    }

    get status(): ControlStatus {
        if (this.is_profile) {
            return "From Profile";
        } else if (
            !this.status_list ||
            this.status_list.length === 0 ||
            this.status_list.includes("error")
        ) {
            return "Profile Error";
        } else if (this.wraps.impact == 0) {
            return "Not Applicable";
        } else if (this.status_list.includes("failed")) {
            return "Failed";
        } else if (this.status_list.includes("passed")) {
            return "Passed";
        } else if (this.status_list.includes("skipped")) {
            return "Not Reviewed";
        } else {
            return "Profile Error"; // Shouldn't get here, but might as well have fallback
        }
    }

    abstract get segments(): HDFControlSegment[] | undefined;
    abstract get is_profile(): boolean;
}

export class ExecControl extends HDFControl_1_0 implements HDFControl {
    constructor(control: ResultControl_1_0) {
        super(control);
    }

    // Helper to cast
    private get typed_wrap(): ResultControl_1_0 {
        return this.wraps as ResultControl_1_0;
    }

    get message(): string {
        if (this.typed_wrap.impact != 0) {
            // If it has any impact, convert each result to a message line and chain them all together
            return this.typed_wrap.results
                .map(HDFControl_1_0.toMessageLine)
                .join("");
        } else {
            // If it's no impact, just post the description (if it exists)
            return this.typed_wrap.desc || "No message found.";
        }
    }

    get start_time(): string | undefined {
        if (this.typed_wrap.results && this.typed_wrap.results.length) {
            return this.typed_wrap.results[0].start_time;
        }
        return undefined;
    }

    get segments(): HDFControlSegment[] {
        return this.typed_wrap.results.map(result => {
            return {
                status: result.status || "no_status",
                message: result.message || undefined,
                code_desc: result.code_desc,
                skip_message: result.skip_message || undefined,
                exception: result.exception || undefined,
                backtrace: result.backtrace || undefined,
                start_time: result.start_time,
                run_time: result.run_time || undefined,
                resource: result.resource || undefined,
            };
        });
    }

    readonly is_profile: boolean = false;
}

export class ProfileControl extends HDFControl_1_0 implements HDFControl {
    constructor(control: ProfileControl_1_0) {
        super(control);
    }

    // Helper to save us having to do (this.wraps as ProfileControl) everywehre. We know the type
    private get typed_wrap(): ProfileControl_1_0 {
        return this.wraps as ProfileControl_1_0;
    }

    get message(): string {
        // If it's no impact, just post the description (if it exists)
        return this.typed_wrap.desc || "No message found.";
    }

    readonly is_profile: boolean = false;
    readonly segments: undefined;
}
