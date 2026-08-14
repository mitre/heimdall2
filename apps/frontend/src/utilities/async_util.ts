/* Provides async wrappers over various common functions/tasks */

/** Provides the resulting text of reading a file as a promise */
export async function readFileAsync(file: File): Promise<string> {
  // Blob#text is the same read as FileReader.readAsText, minus the event
  // plumbing — and it can only ever yield a string, so there is no longer a
  // non-string result to guard against.
  return file.text();
}

/** Checks that a value is not null or undefined at a singular point.
 * Provides easy tracking of where data constraints aren't satisfied.
 */
export function defined<T>(x: T | null | undefined): T {
  if (x === null || x === undefined) {
    throw new Error('Value must not be null/undefined');
  } else {
    return x;
  }
}

/** Sleeps for a given # of milliseconds */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
