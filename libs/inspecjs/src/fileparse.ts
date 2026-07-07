// Import all of our parsers
// V 1.0
import {
  type ContextualizedEvaluation,
  type ContextualizedProfile,
  contextualizeEvaluation,
  contextualizeProfile,
} from './context';
import * as EXEC_JSON_1_0 from './generated_parsers/v_1_0/exec-json';
import * as EXEC_JSON_MIN_1_0 from './generated_parsers/v_1_0/exec-jsonmin';
import * as PROFILE_JSON_1_0 from './generated_parsers/v_1_0/profile-json';

// Define our type. This is the result of trying to parse the file. The appropriate field (exactly one) will be filled
// In case of schema version ambiguity we will use the 1.0 schema
type ConversionResults = {
  // 1.0 types
  '1_0_ExecJson'?: EXEC_JSON_1_0.ExecJSON;
  '1_0_ExecJsonMin'?: EXEC_JSON_MIN_1_0.ExecJsonmin;
  '1_0_ProfileJson'?: PROFILE_JSON_1_0.ProfileJSON;
};

export type ConversionErrors = { [K in keyof ConversionResults]?: unknown };
export type ConversionResult = ConversionResults & { errors?: ConversionErrors };

/**
 * Try to convert the given json text into a valid profile.
 *
 * @param jsonText The json file contents
 */
export function convertFile(
  jsonText: string,
  keepErrors = false,
): ConversionResult {
  // Establish result
  const result: ConversionResult = {};

  // 1.0
  const errors: ConversionErrors = {};
  try {
    result['1_0_ExecJson'] = EXEC_JSON_1_0.Convert.toExecJSON(jsonText);
    return result;
  } catch (error) {
    errors['1_0_ExecJson'] = error;
  }

  try {
    result['1_0_ExecJsonMin']
      = EXEC_JSON_MIN_1_0.Convert.toExecJsonmin(jsonText);
    return result;
  } catch (error) {
    errors['1_0_ExecJsonMin'] = error;
  }

  try {
    result['1_0_ProfileJson']
      = PROFILE_JSON_1_0.Convert.toProfileJSON(jsonText);
    return result;
  } catch (error) {
    errors['1_0_ProfileJson'] = error;
  }

  if (keepErrors) {
    return {
      ...result,
      errors,
    };
  }
  throw new Error(
    'Unable to convert input json. '
    + 'This usually means the file is malformed - please check that the software that generated it is up to date, '
    + 'and, failing that, file an issue with the inspecjs project on github',
  );
}

// Provide some convenient types for different schemas
// All (non-min) results at once
export type AnyExec = EXEC_JSON_1_0.ExecJSON;
export type AnyEval = AnyExec;
// All profiles at once
export type AnyProfile
  = | EXEC_JSON_1_0.ExecJSONProfile
    | PROFILE_JSON_1_0.ProfileJSON;
export type AnyEvalProfile = EXEC_JSON_1_0.ExecJSONProfile;
// All full (not min) controls at once
export type AnyControl
  = | EXEC_JSON_1_0.ExecJSONControl
    | PROFILE_JSON_1_0.ProfileJSONControl;
export type AnyEvalControl = EXEC_JSON_1_0.ExecJSONControl;

/**
 * Converts a file and makes a contextual datum of it
 */
export function convertFileContextual(
  jsonText: string,
): ContextualizedEvaluation | ContextualizedProfile {
  // Convert it
  const result = convertFile(jsonText, true);

  // Determine what sort of file we (hopefully) have, then add it
  if (result['1_0_ExecJson']) {
    // Handle as exec
    const evaluation = result['1_0_ExecJson'];
    return contextualizeEvaluation(evaluation);
  } else if (result['1_0_ProfileJson']) {
    // Handle as profile
    const profile = result['1_0_ProfileJson'];
    return contextualizeProfile(profile);
  } else {
    throw new Error('Failed to convert file due to possible errors');
  }
}

export function isContextualizedEvaluation(
  v: ContextualizedEvaluation | ContextualizedProfile,
): v is ContextualizedEvaluation {
  return !('sourcedFrom' in v);
}

export function isContextualizedProfile(
  v: ContextualizedEvaluation | ContextualizedProfile,
): v is ContextualizedProfile {
  return !isContextualizedEvaluation(v);
}
