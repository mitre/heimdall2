// To parse this data:
//
//   import { Convert, ExecJSON } from "./file";
//
//   const execJSON = Convert.toExecJSON(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * The top level value containing all of the results.
 */
export interface ExecJSON {
    /**
     * Information on the platform the run from the tool that generated the findings was from.
     * Example: the name of the operating system.
     */
    platform: Platform;
    /**
     * Information on the run(s) from the tool that generated the findings.  Example: the
     * findings.
     */
    profiles: ExecJSONProfile[];
    /**
     * Statistics for the run(s) from the tool that generated the findings.  Example: the
     * runtime duration.
     */
    statistics: Statistics;
    /**
     * Version number of the tool that generated the findings.  Example: '4.18.108' is a version
     * of Chef InSpec.
     */
    version: string;
}

/**
 * Information on the platform the run from the tool that generated the findings was from.
 * Example: the name of the operating system.
 *
 * Platform information such as its name.
 */
export interface Platform {
    /**
     * The name of the platform this was run on.
     */
    name: string;
    /**
     * The version of the platform this was run on.
     */
    release: string;
    /**
     * The id of the target.  Example: the name and version of the operating system were not
     * sufficient to identify the platform so a release identifier can additionally be provided
     * like '21H2' for the release version of MS Windows 10.
     */
    target_id?: null | string;
}

/**
 * Information on the set of controls assessed.  Example: it can include the name of the
 * Inspec profile and any findings.
 */
export interface ExecJSONProfile {
    /**
     * The input(s) or attribute(s) used in the run.
     */
    attributes: { [key: string]: any }[];
    /**
     * The set of controls including any findings.
     */
    controls: ExecJSONControl[];
    /**
     * The copyright holder(s).
     */
    copyright?: null | string;
    /**
     * The email address or other contact information of the copyright holder(s).
     */
    copyright_email?: null | string;
    /**
     * The set of dependencies this profile depends on.  Example: an overlay profile is
     * dependent on another profile.
     */
    depends?: Dependency[] | null;
    /**
     * The description - should be more detailed than the summary.
     */
    description?: null | string;
    /**
     * A set of descriptions for the control groups.  Example: the ids of the controls.
     */
    groups: ControlGroup[];
    /**
     * The version of Inspec.
     */
    inspec_version?: null | string;
    /**
     * The copyright license.  Example: the full text or the name, such as 'Apache License,
     * Version 2.0'.
     */
    license?: null | string;
    /**
     * The maintainer(s).
     */
    maintainer?: null | string;
    /**
     * The name - must be unique.
     */
    name: string;
    /**
     * The name of the parent profile if the profile is a dependency of another.
     */
    parent_profile?: null | string;
    /**
     * The checksum of the profile.
     */
    sha256: string;
    /**
     * The reason for skipping if it was skipped.
     */
    skip_message?: null | string;
    /**
     * The status.  Example: loaded.
     */
    status?: null | string;
    /**
     * The reason for the status.  Example: why it was skipped or failed to load.
     */
    status_message?: null | string;
    /**
     * The summary.  Example: the Security Technical Implementation Guide (STIG) header.
     */
    summary?: null | string;
    /**
     * The set of supported platform targets.
     */
    supports: SupportedPlatform[];
    /**
     * The title - should be human readable.
     */
    title?: null | string;
    /**
     * The version of the profile.
     */
    version?: null | string;
}

/**
 * Describes a control and any findings it has.
 */
export interface ExecJSONControl {
    attestation_data?: null | AttestationData;
    /**
     * The raw source code of the control. Note that if this is an overlay control, it does not
     * include the underlying source code.
     */
    code?: null | string;
    /**
     * The description for the overarching control.
     */
    desc?: null | string;
    /**
     * A set of additional descriptions.  Example: the 'fix' text.
     */
    descriptions?: ControlDescription[] | null;
    /**
     * The id.
     */
    id: string;
    /**
     * The impactfulness or severity.
     */
    impact: number;
    /**
     * The set of references to external documents.
     */
    refs: Reference[];
    /**
     * The set of all tests within the control and their results and findings.
     * Example:
     * For Chef Inspec, if in the control's code we had the following:
     * describe sshd_config do
     * its('Port') { should cmp 22 }
     * end
     * The findings from this block would be appended to the results, as well as those of any
     * other blocks within the control.
     */
    results: ControlResult[];
    /**
     * The explicit location of the control within the source code.
     */
    source_location: SourceLocation;
    /**
     * A set of tags - usually metadata.
     */
    tags: { [key: string]: any };
    /**
     * The title - is nullable.
     */
    title?:       null | string;
    waiver_data?: null | WaiverData;
}

export interface AttestationData {
    control_id:  string;
    explanation: string;
    frequency:   string;
    status:      ControlAttestationStatus;
    updated:     string;
    updated_by:  string;
}

/**
 * The attested status of the control
 */
export enum ControlAttestationStatus {
    Failed = "failed",
    Passed = "passed",
}

/**
 * A description for a control.
 */
export interface ControlDescription {
    /**
     * The text of the description.
     */
    data: string;
    /**
     * The type of description.  Examples: 'fix' or 'check'.
     */
    label: string;
}

/**
 * A reference to an external document.
 *
 * A human readable/meaningful reference.  Example: a book title.
 *
 * A url pointing at the reference.
 *
 * A uri pointing at the reference.
 */
export interface Reference {
    ref?: { [key: string]: any }[] | string;
    url?: string;
    uri?: string;
}

/**
 * A test within a control and its results and findings such as how long it took to run.
 */
export interface ControlResult {
    /**
     * The stacktrace/backtrace of the exception if one occurred.
     */
    backtrace?: string[] | null;
    /**
     * A description of this test.  Example: 'limits.conf * is expected to include ['hard',
     * 'maxlogins', '10'].
     */
    code_desc: string;
    /**
     * The type of exception if an exception was thrown.
     */
    exception?: null | string;
    /**
     * An explanation of the test status - usually only provided when the test fails.
     */
    message?: null | string;
    /**
     * Original status of the control (only set if overriden)
     */
    originalStatus?: null | string;
    override?:       null | ControlResultOverride;
    /**
     * The resource used in the test.  Example: in Inspec, you can use the 'File' resource.
     */
    resource?: null | string;
    /**
     * The unique identifier of the resource.
     */
    resource_id?: null | string;
    /**
     * Result source
     */
    result_source?: null | string;
    /**
     * The execution time in seconds for the test.
     */
    run_time?: number | null;
    /**
     * An explanation of the test status if the status was 'skipped.
     */
    skip_message?: null | string;
    /**
     * The time at which the test started.
     */
    start_time: string;
    status?:    ControlResultStatus | null;
}

/**
 * Control override extended information
 */
export interface ControlResultOverride {
    cab_date?:               null | string;
    cab_status?:             ControlResultStatus | null;
    cyber_reviewer?:         null | string;
    date_modified?:          null | string;
    description?:            null | string;
    info_url?:               null | string;
    is_approved?:            boolean | null;
    pipeline_hash?:          null | string;
    request_type?:           null | string;
    review_update?:          null | string;
    reviewer?:               null | string;
    revised_categorization?: null | string;
    revised_severity?:       number | null;
    ticket_tracking?:        null | string;
}

/**
 * The status of a control.  Should be one of 'passed', 'failed', 'skipped', or 'error'.
 *
 * The status of this test within the control.  Example: 'failed'.
 */
export enum ControlResultStatus {
    Error = "error",
    Failed = "failed",
    NotApplicable = "not_applicable",
    Passed = "passed",
    Pending = "pending",
    Skipped = "skipped",
}

/**
 * The explicit location of the control within the source code.
 *
 * The explicit location of the control.
 */
export interface SourceLocation {
    /**
     * The line on which this control is located.
     */
    line?: number | null;
    /**
     * Path to the file that this control originates from.
     */
    ref?: null | string;
}

export interface WaiverData {
    expiration_date?:       null | string;
    justification?:         null | string;
    message?:               null | string;
    run?:                   boolean | null;
    skipped_due_to_waiver?: boolean | null | string;
}

/**
 * A dependency for a profile.  Can include relative paths or urls for where to find the
 * dependency.
 */
export interface Dependency {
    /**
     * The branch name for a git repo.
     */
    branch?: null | string;
    /**
     * The 'user/profilename' attribute for an Automate server.
     */
    compliance?: null | string;
    /**
     * The location of the git repo.  Example:
     * 'https://github.com/mitre/canonical-ubuntu-18.04-lts-stig-baseline.git'.
     */
    git?: null | string;
    /**
     * The name/assigned alias.
     */
    name?: null | string;
    /**
     * The relative path if the dependency is locally available.
     */
    path?: null | string;
    /**
     * The status.  Should be: 'loaded', 'failed', or 'skipped'.
     */
    status?: null | string;
    /**
     * The reason for the status if it is 'failed' or 'skipped'.
     */
    status_message?: null | string;
    /**
     * The 'user/profilename' attribute for a Supermarket server.
     */
    supermarket?: null | string;
    /**
     * The address of the dependency.
     */
    url?: null | string;
}

/**
 * Descriptions for controls in a group, such as the list of all the controls.
 */
export interface ControlGroup {
    /**
     * The set of controls as specified by their ids in this group.  Example: 'V-75443'.
     */
    controls: string[];
    /**
     * The unique identifier for the group.  Example: the relative path to the file specifying
     * the controls.
     */
    id: string;
    /**
     * The title of the group - should be human readable.
     */
    title?: null | string;
}

/**
 * A supported platform target.  Example: the platform name being 'ubuntu'.
 */
export interface SupportedPlatform {
    /**
     * Deprecated in favor of platform-family.
     */
    "os-family"?: null | string;
    /**
     * Deprecated in favor of platform-name.
     */
    "os-name"?: null | string;
    /**
     * The location of the platform.  Can be: 'os', 'aws', 'azure', or 'gcp'.
     */
    platform?: null | string;
    /**
     * The platform family.  Example: 'redhat'.
     */
    "platform-family"?: null | string;
    /**
     * The platform name - can include wildcards.  Example: 'debian'.
     */
    "platform-name"?: null | string;
    /**
     * The release of the platform.  Example: '20.04' for 'ubuntu'.
     */
    release?: null | string;
}

/**
 * Statistics for the run(s) from the tool that generated the findings.  Example: the
 * runtime duration.
 *
 * Statistics for the run(s) such as how long it took.
 */
export interface Statistics {
    controls?: null | StatisticHash;
    /**
     * How long (in seconds) this run by the tool was.
     */
    duration?: number | null;
}

/**
 * Breakdowns of control statistics by result
 *
 * Statistics for the control results.
 */
export interface StatisticHash {
    failed?:  null | StatisticBlock;
    passed?:  null | StatisticBlock;
    skipped?: null | StatisticBlock;
}

/**
 * Statistics for the controls that failed.
 *
 * Statistics for a given item, such as the total.
 *
 * Statistics for the controls that passed.
 *
 * Statistics for the controls that were skipped.
 */
export interface StatisticBlock {
    /**
     * The total.  Example: the total number of controls in a given category for a run.
     */
    total: number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toExecJSON(json: string): ExecJSON {
        return cast(JSON.parse(json), r("ExecJSON"));
    }

    public static execJSONToJson(value: ExecJSON): string {
        return JSON.stringify(uncast(value, r("ExecJSON")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) {
            const objArr: object[] = [];
            return objArr;
        }
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "ExecJSON": o([
        { json: "platform", js: "platform", typ: r("Platform") },
        { json: "profiles", js: "profiles", typ: a(r("ExecJSONProfile")) },
        { json: "statistics", js: "statistics", typ: r("Statistics") },
        { json: "version", js: "version", typ: "" },
    ], "any"),
    "Platform": o([
        { json: "name", js: "name", typ: "" },
        { json: "release", js: "release", typ: "" },
        { json: "target_id", js: "target_id", typ: u(undefined, u(null, "")) },
    ], "any"),
    "ExecJSONProfile": o([
        { json: "attributes", js: "attributes", typ: a(m("any")) },
        { json: "controls", js: "controls", typ: a(r("ExecJSONControl")) },
        { json: "copyright", js: "copyright", typ: u(undefined, u(null, "")) },
        { json: "copyright_email", js: "copyright_email", typ: u(undefined, u(null, "")) },
        { json: "depends", js: "depends", typ: u(undefined, u(a(r("Dependency")), null)) },
        { json: "description", js: "description", typ: u(undefined, u(null, "")) },
        { json: "groups", js: "groups", typ: a(r("ControlGroup")) },
        { json: "inspec_version", js: "inspec_version", typ: u(undefined, u(null, "")) },
        { json: "license", js: "license", typ: u(undefined, u(null, "")) },
        { json: "maintainer", js: "maintainer", typ: u(undefined, u(null, "")) },
        { json: "name", js: "name", typ: "" },
        { json: "parent_profile", js: "parent_profile", typ: u(undefined, u(null, "")) },
        { json: "sha256", js: "sha256", typ: "" },
        { json: "skip_message", js: "skip_message", typ: u(undefined, u(null, "")) },
        { json: "status", js: "status", typ: u(undefined, u(null, "")) },
        { json: "status_message", js: "status_message", typ: u(undefined, u(null, "")) },
        { json: "summary", js: "summary", typ: u(undefined, u(null, "")) },
        { json: "supports", js: "supports", typ: a(r("SupportedPlatform")) },
        { json: "title", js: "title", typ: u(undefined, u(null, "")) },
        { json: "version", js: "version", typ: u(undefined, u(null, "")) },
    ], "any"),
    "ExecJSONControl": o([
        { json: "attestation_data", js: "attestation_data", typ: u(undefined, u(null, r("AttestationData"))) },
        { json: "code", js: "code", typ: u(undefined, u(null, "")) },
        { json: "desc", js: "desc", typ: u(undefined, u(null, "")) },
        { json: "descriptions", js: "descriptions", typ: u(undefined, u(a(r("ControlDescription")), null)) },
        { json: "id", js: "id", typ: "" },
        { json: "impact", js: "impact", typ: 3.14 },
        { json: "refs", js: "refs", typ: a(r("Reference")) },
        { json: "results", js: "results", typ: a(r("ControlResult")) },
        { json: "source_location", js: "source_location", typ: r("SourceLocation") },
        { json: "tags", js: "tags", typ: m("any") },
        { json: "title", js: "title", typ: u(undefined, u(null, "")) },
        { json: "waiver_data", js: "waiver_data", typ: u(undefined, u(null, r("WaiverData"))) },
    ], "any"),
    "AttestationData": o([
        { json: "control_id", js: "control_id", typ: "" },
        { json: "explanation", js: "explanation", typ: "" },
        { json: "frequency", js: "frequency", typ: "" },
        { json: "status", js: "status", typ: r("ControlAttestationStatus") },
        { json: "updated", js: "updated", typ: "" },
        { json: "updated_by", js: "updated_by", typ: "" },
    ], "any"),
    "ControlDescription": o([
        { json: "data", js: "data", typ: "" },
        { json: "label", js: "label", typ: "" },
    ], "any"),
    "Reference": o([
        { json: "ref", js: "ref", typ: u(undefined, u(a(m("any")), "")) },
        { json: "url", js: "url", typ: u(undefined, "") },
        { json: "uri", js: "uri", typ: u(undefined, "") },
    ], "any"),
    "ControlResult": o([
        { json: "backtrace", js: "backtrace", typ: u(undefined, u(a(""), null)) },
        { json: "code_desc", js: "code_desc", typ: "" },
        { json: "exception", js: "exception", typ: u(undefined, u(null, "")) },
        { json: "message", js: "message", typ: u(undefined, u(null, "")) },
        { json: "originalStatus", js: "originalStatus", typ: u(undefined, u(null, "")) },
        { json: "override", js: "override", typ: u(undefined, u(null, r("ControlResultOverride"))) },
        { json: "resource", js: "resource", typ: u(undefined, u(null, "")) },
        { json: "resource_id", js: "resource_id", typ: u(undefined, u(null, "")) },
        { json: "result_source", js: "result_source", typ: u(undefined, u(null, "")) },
        { json: "run_time", js: "run_time", typ: u(undefined, u(3.14, null)) },
        { json: "skip_message", js: "skip_message", typ: u(undefined, u(null, "")) },
        { json: "start_time", js: "start_time", typ: "" },
        { json: "status", js: "status", typ: u(undefined, u(r("ControlResultStatus"), null)) },
    ], "any"),
    "ControlResultOverride": o([
        { json: "cab_date", js: "cab_date", typ: u(undefined, u(null, "")) },
        { json: "cab_status", js: "cab_status", typ: u(undefined, u(r("ControlResultStatus"), null)) },
        { json: "cyber_reviewer", js: "cyber_reviewer", typ: u(undefined, u(null, "")) },
        { json: "date_modified", js: "date_modified", typ: u(undefined, u(null, "")) },
        { json: "description", js: "description", typ: u(undefined, u(null, "")) },
        { json: "info_url", js: "info_url", typ: u(undefined, u(null, "")) },
        { json: "is_approved", js: "is_approved", typ: u(undefined, u(true, null)) },
        { json: "pipeline_hash", js: "pipeline_hash", typ: u(undefined, u(null, "")) },
        { json: "request_type", js: "request_type", typ: u(undefined, u(null, "")) },
        { json: "review_update", js: "review_update", typ: u(undefined, u(null, "")) },
        { json: "reviewer", js: "reviewer", typ: u(undefined, u(null, "")) },
        { json: "revised_categorization", js: "revised_categorization", typ: u(undefined, u(null, "")) },
        { json: "revised_severity", js: "revised_severity", typ: u(undefined, u(3.14, null)) },
        { json: "ticket_tracking", js: "ticket_tracking", typ: u(undefined, u(null, "")) },
    ], "any"),
    "SourceLocation": o([
        { json: "line", js: "line", typ: u(undefined, u(3.14, null)) },
        { json: "ref", js: "ref", typ: u(undefined, u(null, "")) },
    ], "any"),
    "WaiverData": o([
        { json: "expiration_date", js: "expiration_date", typ: u(undefined, u(null, "")) },
        { json: "justification", js: "justification", typ: u(undefined, u(null, "")) },
        { json: "message", js: "message", typ: u(undefined, u(null, "")) },
        { json: "run", js: "run", typ: u(undefined, u(true, null)) },
        { json: "skipped_due_to_waiver", js: "skipped_due_to_waiver", typ: u(undefined, u(true, null, "")) },
    ], "any"),
    "Dependency": o([
        { json: "branch", js: "branch", typ: u(undefined, u(null, "")) },
        { json: "compliance", js: "compliance", typ: u(undefined, u(null, "")) },
        { json: "git", js: "git", typ: u(undefined, u(null, "")) },
        { json: "name", js: "name", typ: u(undefined, u(null, "")) },
        { json: "path", js: "path", typ: u(undefined, u(null, "")) },
        { json: "status", js: "status", typ: u(undefined, u(null, "")) },
        { json: "status_message", js: "status_message", typ: u(undefined, u(null, "")) },
        { json: "supermarket", js: "supermarket", typ: u(undefined, u(null, "")) },
        { json: "url", js: "url", typ: u(undefined, u(null, "")) },
    ], "any"),
    "ControlGroup": o([
        { json: "controls", js: "controls", typ: a("") },
        { json: "id", js: "id", typ: "" },
        { json: "title", js: "title", typ: u(undefined, u(null, "")) },
    ], "any"),
    "SupportedPlatform": o([
        { json: "os-family", js: "os-family", typ: u(undefined, u(null, "")) },
        { json: "os-name", js: "os-name", typ: u(undefined, u(null, "")) },
        { json: "platform", js: "platform", typ: u(undefined, u(null, "")) },
        { json: "platform-family", js: "platform-family", typ: u(undefined, u(null, "")) },
        { json: "platform-name", js: "platform-name", typ: u(undefined, u(null, "")) },
        { json: "release", js: "release", typ: u(undefined, u(null, "")) },
    ], "any"),
    "Statistics": o([
        { json: "controls", js: "controls", typ: u(undefined, u(null, r("StatisticHash"))) },
        { json: "duration", js: "duration", typ: u(undefined, u(3.14, null)) },
    ], "any"),
    "StatisticHash": o([
        { json: "failed", js: "failed", typ: u(undefined, u(null, r("StatisticBlock"))) },
        { json: "passed", js: "passed", typ: u(undefined, u(null, r("StatisticBlock"))) },
        { json: "skipped", js: "skipped", typ: u(undefined, u(null, r("StatisticBlock"))) },
    ], "any"),
    "StatisticBlock": o([
        { json: "total", js: "total", typ: 3.14 },
    ], "any"),
    "ControlAttestationStatus": [
        "failed",
        "passed",
    ],
    "ControlResultStatus": [
        "error",
        "failed",
        "not_applicable",
        "passed",
        "pending",
        "skipped",
    ],
};
