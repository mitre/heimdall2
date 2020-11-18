import * as fs from 'fs';

/** Returns sorted list of files in a directory */
export function list_files(dir_path: string) {
  // Init result array
  const result = fs.readdirSync(dir_path);

  // Sort by filename
  return result.sort();
}

export interface FileResult {
  /** The filename */
  name: string;

  /** The file's content (utf-8) */
  content: string;
}

export function read_files(dir_name: string): FileResult[] {
  // List the files
  const files = list_files(dir_name);

  // Read them all
  const result = files.map((filename) => {
    const content = fs.readFileSync(dir_name + filename, 'utf-8');
    const result: FileResult = {
      name: filename,
      content
    };
    return result;
  });
  return result;
}

export type FileHash = {[key: string]: FileResult};
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
