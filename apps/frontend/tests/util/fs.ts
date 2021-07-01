import * as fs from 'fs';

/** Returns sorted list of files in a directory */
export function list_files(dirPath: string) {
  // Init result array
  const result = fs.readdirSync(dirPath);

  // Sort by filename
  return result.sort();
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
    const content = fs.readFileSync(dirName + filename, 'utf-8');
    return {
      name: filename,
      content
    };
  });
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
