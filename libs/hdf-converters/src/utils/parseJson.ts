import {Result} from './result';

export function parseJson(str: string): Result<Record<string, unknown>, Error> {
  try {
    return {ok: true, value: JSON.parse(str)};
  } catch (e) {
    return {ok: false, error: e};
  }
}
