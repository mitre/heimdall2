/** For helper functions that don't belong anywhere else */

/** Compares arrays a and b, returning a number indicating their lexicographic ordering
 * with the same output semantics.
 * That is,
 * a === b as determined by the comparator function, return 0;
 * if a is lexicographically before b, return < 0
 * if a is lexicographically after  b, return > 1
 */
export function compare_arrays<T>(
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

/** Stores/retrives a simple JSON object from localstorage.
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
  get_default(_default: T): T {
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

/** A useful shorthand */
export type Hash<T> = {[key: string]: T};

/** Groups items by using the provided key function */
export function group_by<T>(
  items: Array<T>,
  keyGetter: (v: T) => string
): Hash<Array<T>> {
  const result: Hash<Array<T>> = {};
  for (const i of items) {
    // Get the items key
    const key = keyGetter(i);

    // Get the list it should go in
    const corrList = result[key];
    if (corrList) {
      // If list exists, place
      corrList.push(i);
    } else {
      // List does not exist; create and put
      result[key] = [i];
    }
  }
  return result;
}

/** Maps a hash to a new hash, with the same keys but each value replaced with a new (mapped) value */
export function map_hash<T, G>(
  old: Hash<T>,
  mapFunction: (v: T) => G
): Hash<G> {
  const result: Hash<G> = {};
  for (const key in old) {
    result[key] = mapFunction(old[key]);
  }
  return result;
}

/** Converts a simple, single level json dict into uri params */
export function to_uri_params(params: Hash<string | number | boolean>) {
  const esc = encodeURIComponent;
  return Object.keys(params)
    .map((k) => `${esc(k)}=${esc(params[k])}`)
    .join('&');
}

/** Generate a basic authentication string for http requests */
export function basic_auth(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

export interface IVuetifyItems {
  text: string | number;
  value: string | number | boolean;
  disabled?: boolean;
}
