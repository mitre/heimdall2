import * as fs from 'fs';

/** Orders by UTF-16 code unit, which is what a bare sort() does. */
function byCodeUnit(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

/** Returns sorted list of files in a directory */
export function list_files(dirPath: string) {
  // Init result array
  const result = fs.readdirSync(dirPath);

  // Sort by filename
  return result.toSorted(byCodeUnit);
}

export interface FileResult {
  /** The filename */
  name: string;

  /** The file's content (utf-8) */
  content: string;
}

export function read_files(dirName: string): FileResult[] {
  // List the files
  const files = list_files(dirName);

  // Read them all
  return files.map((filename) => {
    const content = fs.readFileSync(dirName + filename, 'utf8');
    return {
      name: filename,
      content
    };
  });
}

export type FileHash = Record<string, FileResult>;
export function populate_hash(results: FileResult[]) {
  const hash: FileHash = {};
  results.forEach((f) => {
    hash[f.name] = f;
  });
  return hash;
}

export function AllCounts(): FileHash {
  const results = read_files('tests/hdf_data/counts/');
  return populate_hash(results);
}

export function AllInfo(): FileHash {
  const results = read_files('tests/hdf_data/inspec_tools_info/');
  return populate_hash(results);
}

export function AllRaw(): FileHash {
  const results = read_files('tests/hdf_data/raw_data/');
  return populate_hash(results);
}
