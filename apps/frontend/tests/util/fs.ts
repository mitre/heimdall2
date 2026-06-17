import * as fs from 'fs';

export type FileHash = Record<string, FileResult>;

export type FileResult = {
  /** The file's content (utf-8) */
  content: string;

  /** The filename */
  name: string;
};

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

/** Returns sorted list of files in a directory */
export function list_files(dirPath: string) {
  // Init result array
  const result = fs.readdirSync(dirPath);

  // Sort by filename
  return result.sort();
}

export function populate_hash(results: FileResult[]) {
  const hash: FileHash = {};
  for (const f of results) {
    hash[f.name] = f;
  }
  return hash;
}

export function read_files(dirName: string): FileResult[] {
  // List the files
  const files = list_files(dirName);

  // Read them all
  return files.map((filename) => {
    const content = fs.readFileSync(dirName + filename, 'utf8');
    return {
      content,
      name: filename,
    };
  });
}
