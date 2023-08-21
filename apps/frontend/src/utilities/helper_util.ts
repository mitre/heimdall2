/** For helper functions that don't belong anywhere else */

import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';

/** Compares arrays a and b, returning a number indicating their lexicographic ordering
 * with the same output semantics.
 * That is,
 * a === b as determined by the comparator function, return 0;
 * if a is lexicographically before b, return < 0
 * if a is lexicographically after  b, return > 1
 */
export function compareArrays<T>(
  a: Array<T>,
  b: Array<T>,
  comparator: (a: T, b: T) => number
) {
  // Compare element-wise
  for (let i = 0; i < a.length && i < b.length; i++) {
    const x = comparator(a[i], b[i]);
    if (x) {
      return x;
    }
  }

  // If we escape the loop, make final decision based on difference in length
  if (a.length > b.length) {
    // a longer => a after b => return positive
    return 1;
  } else if (a.length === b.length) {
    // Completely equal
    return 0;
  } else {
    // b longer => a before b => Return negative
    return -1;
  }
}

/** Stores/retrieves a simple JSON object from localstorage.
 * Will not store/retrieve methods - be advised! It won't work with class types!
 */
export class LocalStorageVal<T> {
  private readonly storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  /** Retrieves the currently held item, as resolved by JSON.parse */
  get(): T | null {
    // Fetch the string, failing early if not set
    const s = window.localStorage.getItem(this.storageKey);
    if (!s) {
      return null;
    }

    // Then try parsing. On fail, clear and go null
    try {
      return JSON.parse(s);
    } catch (error) {
      this.clear();
      return null;
    }
  }

  /** Wraps get, providing the provided default if necessary */
  getDefault(_default: T): T {
    const v = this.get();
    if (v === null) {
      return _default;
    } else {
      return v;
    }
  }

  /** Sets the local storage value to the given value, stringified */
  set(val: T): void {
    const nv = JSON.stringify(val);
    window.localStorage.setItem(this.storageKey, nv);
  }

  /** Clears the local storage value */
  clear(): void {
    window.localStorage.removeItem(this.storageKey);
  }
}

/** Get description from Array of descriptions or Key/String pair */
export function getDescription(
  descriptions:
    | {
        [key: string]: string;
      }
    | ExecJSON.ControlDescription[],
  key: string
): string | undefined {
  let found: string | undefined;
  if (Array.isArray(descriptions)) {
    found = descriptions.find(
      (description: ExecJSON.ControlDescription) =>
        description.label.toLowerCase() === key
    )?.data;
  } else {
    found = _.get(descriptions, key);
  }

  return found;
}

/** A useful shorthand */
export type Hash<T> = {[key: string]: T};

/** Converts a simple, single level json dict into uri params */
export function toURIParams(params: Hash<string | number | boolean>) {
  const esc = encodeURIComponent;
  return Object.keys(params)
    .map((k) => `${esc(k)}=${esc(params[k])}`)
    .join('&');
}

/** Generate a basic authentication string for http requests */
export function basicAuth(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

export interface IVuetifyItems {
  text: string | number;
  value: string | number | boolean;
  disabled?: boolean;
}
