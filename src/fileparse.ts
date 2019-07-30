// Import all of our parsers
// V 1.0
import * as EXEC_JSON_1_0 from "./generated-parsers/exec-json";
import * as EXEC_JSON_MIN_1_0 from "./generated-parsers/exec-jsonmin";
import * as PROFILE_JSON_1_0 from "./generated-parsers/profile-json";

// TODO: Any future versions

// Define our type. This is the result of trying to parse the file. The appropriate field (exactly one) will be filled
// In case of schema version ambiguity we will use the 1.0 schema
export interface ConversionResult {
    // 1.0 types
    "1_0_ExecJson"?: EXEC_JSON_1_0.ExecJSON,
    "1_0_ExecJsonMin"?: EXEC_JSON_MIN_1_0.ExecJsonmin,
    "1_0_ProfileJson"?: PROFILE_JSON_1_0.ProfileJSON,
}

 /**
  * Try to convert the given json text into a valid profile.
  * 
  * @param json_text The json file contents
  */
export function convertFile(json_text: string): ConversionResult {
    // Establish result
    let result: ConversionResult = {};

    // 1.0
    try {
        result["1_0_ExecJson"] = EXEC_JSON_1_0.Convert.toExecJSON(json_text);
        return result;
    } catch(e){ /* Don't care */ }

    try {
        result["1_0_ExecJsonMin"] = EXEC_JSON_MIN_1_0.Convert.toExecJsonmin(json_text);
        return result;
    } catch(e){ /* Don't care */ }

    try {
        result["1_0_ProfileJson"] = PROFILE_JSON_1_0.Convert.toProfileJSON(json_text);
        return result;
    } catch(e){ /* Don't care */ }

    // 1.*
    // ...

    throw "Unable to convert inspec json";
}

// Provide some convenient types for different schemas
// All full (not min) controls at once
export type AnyFullControl = PROFILE_JSON_1_0.ProfileJSONControl | EXEC_JSON_1_0.ExecJSONControl; 
