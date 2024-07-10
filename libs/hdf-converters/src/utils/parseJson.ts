import {Result} from './result';

type JSONValue = 
 | string
 | number
 | boolean
 | null
 | JSONValue[]
 | {[key: string]: JSONValue}

export function parseJson(str: string): Result<JSONValue, Error> {
  try {
    return {ok: true, value: JSON.parse(str)};
  } catch (e) {
    return {ok: false, error: e};
  }
}
