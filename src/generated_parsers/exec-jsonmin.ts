// To parse this data:
//
//   import { Convert, ExecJsonmin } from "./file";
//
//   const execJsonmin = Convert.toExecJsonmin(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.
import preprocess from "../preprocessor";

export interface ExecJsonmin {
    controls:   ExecJSONMINControl[];
    statistics: Statistics;
    version:    string;
}

export interface ExecJSONMINControl {
    backtrace?:     string[];
    code_desc:      string;
    exception?:     string;
    id:             string;
    message?:       string;
    profile_id:     null | string;
    profile_sha256: string;
    resource?:      string;
    skip_message?:  string;
    status:         string;
}

export interface Statistics {
    /**
     * Breakdowns of control statistics by result
     */
    controls?: StatisticHash;
    /**
     * How long (in seconds) this inspec exec ran for.
     */
    duration: number;
}

/**
 * Breakdowns of control statistics by result
 */
export interface StatisticHash {
    failed?:  StatisticBlock;
    passed?:  StatisticBlock;
    skipped?: StatisticBlock;
}

export interface StatisticBlock {
    /**
     * Total number of controls (in this category) for this inspec execution.
     */
    total: number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toExecJsonmin(json: string): ExecJsonmin {
        return cast(preprocess(json), r("ExecJsonmin"));
    }

    public static execJsonminToJson(value: ExecJsonmin): string {
        return JSON.stringify(uncast(value, r("ExecJsonmin")), null, 2);
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
    "ExecJsonmin": o([
        { json: "controls", js: "controls", typ: a(r("ExecJSONMINControl")) },
        { json: "statistics", js: "statistics", typ: r("Statistics") },
        { json: "version", js: "version", typ: "" },
    ], "any"),
    "ExecJSONMINControl": o([
        { json: "backtrace", js: "backtrace", typ: u(undefined, a("")) },
        { json: "code_desc", js: "code_desc", typ: "" },
        { json: "exception", js: "exception", typ: u(undefined, "") },
        { json: "id", js: "id", typ: "" },
        { json: "message", js: "message", typ: u(undefined, "") },
        { json: "profile_id", js: "profile_id", typ: u(null, "") },
        { json: "profile_sha256", js: "profile_sha256", typ: "" },
        { json: "resource", js: "resource", typ: u(undefined, "") },
        { json: "skip_message", js: "skip_message", typ: u(undefined, "") },
        { json: "status", js: "status", typ: "" },
    ], "any"),
    "Statistics": o([
        { json: "controls", js: "controls", typ: u(undefined, r("StatisticHash")) },
        { json: "duration", js: "duration", typ: 3.14 },
    ], "any"),
    "StatisticHash": o([
        { json: "failed", js: "failed", typ: u(undefined, r("StatisticBlock")) },
        { json: "passed", js: "passed", typ: u(undefined, r("StatisticBlock")) },
        { json: "skipped", js: "skipped", typ: u(undefined, r("StatisticBlock")) },
    ], "any"),
    "StatisticBlock": o([
        { json: "total", js: "total", typ: 3.14 },
    ], "any"),
};
