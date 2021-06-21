// To parse this data:
//
//   import { Convert, ProfileJSON } from "./file";
//
//   const profileJSON = Convert.toProfileJSON(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface ProfileJSON {
    controls:         ProfileJSONControl[];
    copyright?:       null | string;
    copyright_email?: null | string;
    depends?:         Dependency[] | null;
    generator?:       null | Generator;
    groups:           ControlGroup[];
    inputs?:          { [key: string]: any }[] | null;
    maintainer?:      null | string;
    name:             string;
    sha256:           string;
    status?:          null | string;
    supports:         SupportedPlatform[];
    title?:           null | string;
    version?:         null | string;
}

export interface ProfileJSONControl {
    /**
     * The raw source code of the control. Note that if this is an overlay control, it does not
     * include the underlying source code
     */
    code:          string;
    desc?:         null | string;
    descriptions?: { [key: string]: any } | null;
    /**
     * The ID of this control
     */
    id:               string;
    impact:           number;
    refs?:            Reference[] | null;
    source_location?: null | SourceLocation;
    tags:             { [key: string]: any };
    title?:           null | string;
}

export interface Reference {
    ref?: { [key: string]: any }[] | string;
    url?: string;
    uri?: string;
}

export interface SourceLocation {
    /**
     * The line at which this statement is located in the file
     */
    line?: number | null;
    /**
     * Path to the file that this statement originates from
     */
    ref?: null | string;
}

export interface Dependency {
    branch?:       null | string;
    compliance?:   null | string;
    git?:          null | string;
    name?:         null | string;
    path?:         null | string;
    skip_message?: null | string;
    status?:       null | string;
    supermarket?:  null | string;
    url?:          null | string;
}

export interface Generator {
    /**
     * The name of the software that generated this report.
     */
    name: string;
    /**
     * The version of the software that generated this report.
     */
    version: string;
}

export interface ControlGroup {
    /**
     * The control IDs in this group
     */
    controls: string[];
    /**
     * The unique identifier of the group
     */
    id: string;
    /**
     * The name of the group
     */
    title?: null | string;
}

export interface SupportedPlatform {
    "os-family"?:       null | string;
    "os-name"?:         null | string;
    platform?:          null | string;
    "platform-family"?: null | string;
    "platform-name"?:   null | string;
    release?:           null | string;
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

function invalidValue(typ: any, val: any): never {
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        var map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        var map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        var l = typs.length;
        for (var i = 0; i < l; i++) {
            var typ = typs[i];
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
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(typ: any, val: any): any {
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
        var result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps);
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
    if (typ === Date && typeof val !== "number") return transformDate(typ, val);
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
        { json: "descriptions", js: "descriptions", typ: u(undefined, u(m("any"), null)) },
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
        { json: "skip_message", js: "skip_message", typ: u(undefined, u(null, "")) },
        { json: "status", js: "status", typ: u(undefined, u(null, "")) },
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
