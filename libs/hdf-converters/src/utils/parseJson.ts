import type {Result} from './result';

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | {[key: string]: JSONValue};

export function parseJson(str: string): Result<JSONValue, Error> {
  try {
    return {ok: true, value: JSON.parse(str)};
  } catch (error) {
    if (error instanceof Error) {
    return {ok: false, error: error};
    } else {
    return {ok: false, error: new Error(String(error))};
    }
  }
}
