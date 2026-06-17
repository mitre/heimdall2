import type { Result } from './result';

export type JSONValue
  = | boolean
    | JSONValue[]
    | null
    | number
    | string
    | { [key: string]: JSONValue };

export function parseJson(str: string): Result<JSONValue, Error> {
  try {
    return { ok: true, value: JSON.parse(str) };
  } catch (error) {
    return error instanceof Error ? { error: error, ok: false } : { error: new Error(String(error)), ok: false };
  }
}
