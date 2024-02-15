// To parse this data:
//
//   import { Convert, ExecJsonmin } from "./file";
//
//   const execJsonmin = Convert.toExecJsonmin(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface ExecJsonmin {
    /**
     * The set of controls including any findings as reported by the tool.
     */
    controls: ExecJSONMINControl[];
    /**
     * Statistics for the run(s) from the tool that generated the findings.  Example: the
     * runtime duration.
     */
    statistics: Statistics;
    /**
     * Version number of the tool that generated the findings.  Example: '4.18.108' is a version
     * of Chef Inspec.
     */
    version: string;
}

/**
 * The set of all tests within the control and their results and findings.
 */
export interface ExecJSONMINControl {
    /**
     * The stacktrace/backtrace of the exception if one occurred.
     */
    backtrace?: string[] | null;
    /**
     * A description of the control.  Example: 'limits.conf * is expected to include ['hard',
     * 'maxlogins', '10'].
     */
    code_desc: string;
    /**
     * The type of exception if an exception was thrown.
     */
    exception?: null | string;
    /**
     * The id.
     */
    id: string;
    /**
     * An explanation of the control status - usually only provided when the control fails.
     */
    message?: null | string;
    /**
     * The name of the profile that can uniquely identify it - is nullable.
     */
    profile_id?: null | string;
    /**
     * The checksum of the profile.
     */
    profile_sha256: string;
    /**
     * The resource used in the test.  Example: in Inspec, you can use the 'File' resource.
     */
    resource?: null | string;
    /**
     * An explanation of the status if the status was 'skipped'.
     */
    skip_message?: null | string;
    /**
     * The status of the control.  Example: 'failed'.
     */
    status: string;
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
    duration: number;
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
    public static toExecJsonmin(json: string): ExecJsonmin {
        return cast(JSON.parse(json), r("ExecJsonmin"));
    }

    public static execJsonminToJson(value: ExecJsonmin): string {
        return JSON.stringify(uncast(value, r("ExecJsonmin")), null, 2);
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
    "ExecJsonmin": o([
        { json: "controls", js: "controls", typ: a(r("ExecJSONMINControl")) },
        { json: "statistics", js: "statistics", typ: r("Statistics") },
        { json: "version", js: "version", typ: "" },
    ], "any"),
    "ExecJSONMINControl": o([
        { json: "backtrace", js: "backtrace", typ: u(undefined, u(a(""), null)) },
        { json: "code_desc", js: "code_desc", typ: "" },
        { json: "exception", js: "exception", typ: u(undefined, u(null, "")) },
        { json: "id", js: "id", typ: "" },
        { json: "message", js: "message", typ: u(undefined, u(null, "")) },
        { json: "profile_id", js: "profile_id", typ: u(undefined, u(null, "")) },
        { json: "profile_sha256", js: "profile_sha256", typ: "" },
        { json: "resource", js: "resource", typ: u(undefined, u(null, "")) },
        { json: "skip_message", js: "skip_message", typ: u(undefined, u(null, "")) },
        { json: "status", js: "status", typ: "" },
    ], "any"),
    "Statistics": o([
        { json: "controls", js: "controls", typ: u(undefined, u(null, r("StatisticHash"))) },
        { json: "duration", js: "duration", typ: 3.14 },
    ], "any"),
    "StatisticHash": o([
        { json: "failed", js: "failed", typ: u(undefined, u(null, r("StatisticBlock"))) },
        { json: "passed", js: "passed", typ: u(undefined, u(null, r("StatisticBlock"))) },
        { json: "skipped", js: "skipped", typ: u(undefined, u(null, r("StatisticBlock"))) },
    ], "any"),
    "StatisticBlock": o([
        { json: "total", js: "total", typ: 3.14 },
    ], "any"),
};
