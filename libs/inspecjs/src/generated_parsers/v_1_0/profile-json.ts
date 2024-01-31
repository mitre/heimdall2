// To parse this data:
//
//   import { Convert, ProfileJSON } from "./file";
//
//   const profileJSON = Convert.toProfileJSON(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * Information on the set of controls that can be assessed.  Example: it can include the
 * name of the Inspec profile.
 */
export interface ProfileJSON {
    /**
     * The set of controls - contains no findings as the assessment has not yet occurred.
     */
    controls: ProfileJSONControl[];
    /**
     * The copyright holder(s).
     */
    copyright?: null | string;
    /**
     * The email address or other contract information of the copyright holder(s).
     */
    copyright_email?: null | string;
    /**
     * The set of dependencies this profile depends on.  Example: an overlay profile is
     * dependent on another profile.
     */
    depends?:   Dependency[] | null;
    generator?: null | Generator;
    /**
     * A set of descriptions for the control groups.  Example: the ids of the controls.
     */
    groups: ControlGroup[];
    /**
     * The input(s) or attribute(s) used to be in the run.
     */
    inputs?: { [key: string]: any }[] | null;
    /**
     * The maintainer(s).
     */
    maintainer?: null | string;
    /**
     * The name - must be unique.
     */
    name: string;
    /**
     * The checksum of the profile.
     */
    sha256: string;
    /**
     * The status.  Example: skipped.
     */
    status?: null | string;
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
 * The set of all tests within the control.
 */
export interface ProfileJSONControl {
    /**
     * The raw source code of the control. Note that if this is an overlay control, it does not
     * include the underlying source code.
     */
    code: string;
    /**
     * The description for the overarching control.
     */
    desc?:         null | string;
    descriptions?: { [key: string]: string } | null;
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
    refs?:            Reference[] | null;
    source_location?: null | SourceLocation;
    /**
     * A set of tags - usually metadata.
     */
    tags: { [key: string]: any };
    /**
     * The title - is nullable.
     */
    title?: null | string;
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
 * The tool that generated this file.  Example: Chef Inspec.
 */
export interface Generator {
    /**
     * The name.  Example: Chef Inspec.
     */
    name: string;
    /**
     * The version.  Example: 4.18.108.
     */
    version: string;
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

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toProfileJSON(json: string): ProfileJSON {
        return cast(JSON.parse(json), r("ProfileJSON"));
    }

    public static profileJSONToJson(value: ProfileJSON): string {
        return JSON.stringify(uncast(value, r("ProfileJSON")), null, 2);
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
    "ProfileJSON": o([
        { json: "controls", js: "controls", typ: a(r("ProfileJSONControl")) },
        { json: "copyright", js: "copyright", typ: u(undefined, u(null, "")) },
        { json: "copyright_email", js: "copyright_email", typ: u(undefined, u(null, "")) },
        { json: "depends", js: "depends", typ: u(undefined, u(a(r("Dependency")), null)) },
        { json: "generator", js: "generator", typ: u(undefined, u(null, r("Generator"))) },
        { json: "groups", js: "groups", typ: a(r("ControlGroup")) },
        { json: "inputs", js: "inputs", typ: u(undefined, u(a(m("any")), null)) },
        { json: "maintainer", js: "maintainer", typ: u(undefined, u(null, "")) },
        { json: "name", js: "name", typ: "" },
        { json: "sha256", js: "sha256", typ: "" },
        { json: "status", js: "status", typ: u(undefined, u(null, "")) },
        { json: "supports", js: "supports", typ: a(r("SupportedPlatform")) },
        { json: "title", js: "title", typ: u(undefined, u(null, "")) },
        { json: "version", js: "version", typ: u(undefined, u(null, "")) },
    ], "any"),
    "ProfileJSONControl": o([
        { json: "code", js: "code", typ: "" },
        { json: "desc", js: "desc", typ: u(undefined, u(null, "")) },
        { json: "descriptions", js: "descriptions", typ: u(undefined, u(m(""), null)) },
        { json: "id", js: "id", typ: "" },
        { json: "impact", js: "impact", typ: 3.14 },
        { json: "refs", js: "refs", typ: u(undefined, u(a(r("Reference")), null)) },
        { json: "source_location", js: "source_location", typ: u(undefined, u(null, r("SourceLocation"))) },
        { json: "tags", js: "tags", typ: m("any") },
        { json: "title", js: "title", typ: u(undefined, u(null, "")) },
    ], "any"),
    "Reference": o([
        { json: "ref", js: "ref", typ: u(undefined, u(a(m("any")), "")) },
        { json: "url", js: "url", typ: u(undefined, "") },
        { json: "uri", js: "uri", typ: u(undefined, "") },
    ], "any"),
    "SourceLocation": o([
        { json: "line", js: "line", typ: u(undefined, u(3.14, null)) },
        { json: "ref", js: "ref", typ: u(undefined, u(null, "")) },
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
    "Generator": o([
        { json: "name", js: "name", typ: "" },
        { json: "version", js: "version", typ: "" },
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
};
