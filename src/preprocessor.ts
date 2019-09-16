/**
 * Used to pre-process inspec data. Filters out nulls that aren't in whitelisted locations.
 * One might ask, "why do this?". And the answer is quite simply that the old output files performed a bizarre sort of input
 * validation wherein if data wasn't accepted it was replaced with null, regardless of if null was "supposed" to ever go there.
 * As such, the whitelist here protects all the places null is "supposed" to be able to go and simply removes that key in all other
 * places.
 */
export default function preprocess(text: string): any {
    let obj = JSON.parse(text);
    return recursiveStripNulls(obj, []);
}

/** Helper for comparing arrays for partial equality
 * Check that for two arrays
 *  - base, of length n
 *  - test, of length m
 * return true iff
 *  - m >= n and
 *  - base[i] === test[i] for all 0 <= i < n
 */
function check_stack<T>(base: T[], test: T[]): boolean {
    // First check lengths
    if (test.length < base.length) {
        return false;
    }

    // Next check for any inequalities
    for (let i = 0; i < base.length; i++) {
        if (base[i] !== test[i]) {
            return false;
        }
    }

    // If all elements passed the !== check, then arrays are ===
    return true;
}

const whitelist: string[][] = [
    // In exec-jsonmin
    ["controls", "profile_id"],

    // in profile-json
    ["controls", "title"],
    ["controls", "desc"],
    ["controls", "tags"],
    ["groups", "title"],

    // in exec-json
    ["profiles", "controls", "title"],
    ["profiles", "controls", "desc"],
    ["profiles", "controls", "tags"],
    ["profiles", "controls", "results", "backtrace"],
    ["profiles", "groups", "title"],
];

/** Checks if the given stack is present in our whitelist */
function check_whitelist(stack: string[]): boolean {
    return whitelist.some(base => check_stack(base, stack));
}

/**
 * Returns obj but without any null or undefined properties, at any depth.
 * Key paths in the whitelist are ignored.
 *
 * @param obj The object to transform
 * @param curr_stack The sequence of keys navigated to get to the current value
 */
function recursiveStripNulls(obj: any, curr_stack: string[]): any {
    if (obj === null || obj === undefined) {
        // Doesn't really matter as long as it is one of null or undefined
        return null;
    } else if (Array.isArray(obj)) {
        // Want to recurse on array elements
        // We don't care about index; maintain stack
        return obj.map(item => recursiveStripNulls(item, curr_stack));
    } else if (typeof obj === "object") {
        // Add all subkeys that aren't null/undefined to a new object
        let result: any = {};
        Object.keys(obj).forEach(key => {
            let sub_stack = curr_stack.concat([key]);
            let sub = recursiveStripNulls(obj[key], sub_stack);
            // Only put in the value if its not null/undefined OR if it is in the whitelist
            if (
                (sub !== null && sub !== undefined) ||
                check_whitelist(sub_stack)
            ) {
                result[key] = sub;
            }
        });
        return result;
    } else {
        // Nothing else to do - it's probably a number or string
        return obj;
    }
}
