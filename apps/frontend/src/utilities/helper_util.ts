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
    let x = comparator(a[i], b[i]);
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
  private storage_key: string;

  constructor(storage_key: string) {
    this.storage_key = storage_key;
  }

  /** Retrieves the currently held item, as resolved by JSON.parse */
  get(): T | null {
    // Fetch the string, failing early if not set
    let s = window.localStorage.getItem(this.storage_key);
    if (!s) {
      return null;
    }

    // Then try parsing. On fail, clear and go null
    try {
      let v = JSON.parse(s);
      return v;
    } catch (error) {
      this.clear();
      return null;
    }
  }

  /** Wraps get, providing the provided default if necessary */
  get_default(_default: T): T {
    let v = this.get();
    if (v === null) {
      return _default;
    } else {
      return v;
    }
  }

  /** Sets the local storage value to the given value, stringified */
  set(val: T): void {
    let nv = JSON.stringify(val);
    window.localStorage.setItem(this.storage_key, nv);
  }

  /** Clears the local storage value */
  clear(): void {
    window.localStorage.removeItem(this.storage_key);
  }
}

/** A useful shorthand */
export type Hash<T> = {[key: string]: T};

/** Groups items by using the provided key function */
export function group_by<T>(
  items: Array<T>,
  key_getter: (v: T) => string
): Hash<Array<T>> {
  let result: Hash<Array<T>> = {};
  for (let i of items) {
    // Get the items key
    let key = key_getter(i);

    // Get the list it should go in
    let corr_list = result[key];
    if (corr_list) {
      // If list exists, place
      corr_list.push(i);
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
  map_function: (v: T) => G
): Hash<G> {
  let result: Hash<G> = {};
  for (let key in old) {
    result[key] = map_function(old[key]);
  }
  return result;
}

/** Converts a simple, single level json dict into uri params */
export function to_uri_params(params: Hash<string | number | boolean>) {
  let esc = encodeURIComponent;
  let query = Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
  return query;
}

/** Generate a basic authentication string for http requests */
export function basic_auth(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}
