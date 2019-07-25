// Import all of our parsers
// V 1.0
import {ExecJSON as ExecJSON_1_0, Convert as Convert_ExecJson_1_0} from "./generated-parsers/exec-json";
import {ExecJsonmin as ExecJSONMin_1_0, Convert as Convert_ExecJsonMin_1_0} from "./generated-parsers/exec-jsonmin";
import {ProfileJSON as ProfileJSON_1_0, Convert as Convert_ProfileJson_1_0} from "./generated-parsers/profile-json";

// TODO: Any future versions

// Define our type. This is the result of trying to parse the file. The appropriate field (exactly one) will be filled
// In case of schema version ambiguity we will use the 1.0 schema
export interface ConversionResult {
    // 1.0 types
    "1_0_ExecJson"?: ExecJSON_1_0,
    "1_0_ExecJsonMin"?: ExecJSONMin_1_0,
    "1_0_ProfileJson"?: ProfileJSON_1_0,
}

/**
 * Try to convert the given json
 */
export function convertFile(json_text: string): ConversionResult {
    // Establish result
    let result: ConversionResult = {};

    // 1.0
    try {
        result["1_0_ExecJson"] = Convert_ExecJson_1_0.toExecJSON(json_text);
        return result;
    } catch(e){ // Don't care }

    try {
        result["1_0_ExecJsonMin"] = Convert_ExecJsonMin_1_0.toExecJsonmin(json_text);
        return result;
    } catch(e){ // Don't care }

    try {
        result["1_0_ProfileJson"] = Convert_ProfileJson_1_0.toProfileJSON(json_text);
        return result;
    } catch(e){ // Don't care }

    throw "Unable to convert inspec json";
}