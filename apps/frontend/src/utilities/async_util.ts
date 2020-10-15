/* Provides async wrappers over various common functions/tasks */

/** Provides the resulting text of reading a file as a promise */
export async function read_file_async(file: File): Promise<string> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new DOMException('Problem parsing input file.'));
    };

    reader.onload = () => {
      if (reader.result !== null && reader.result !== undefined) {
        resolve(reader.result.toString());
      } else {
        reject(new DOMException('Problem parsing input file.'));
      }
    };
    reader.readAsText(file);
  });
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
