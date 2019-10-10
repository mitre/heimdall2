/**
 * Reads and parses inspec files
 */

import { parse } from "inspecjs";
import { Module, VuexModule, getModule, Action } from "vuex-module-decorators";
import DataModule from "@/store/data_store";
import Store from "@/store/store";
import { read_file_async } from "@/utilities/async_util";

/** Each FileID corresponds to a unique File in this store */
export type FileID = number;

/** Represents the minimum data to represent an uploaded file handle. */
export type InspecFile = {
  /**
   * Unique identifier for this file. Used to encode which file is currently selected, etc.
   *
   * Note that in general one can assume that if a file A is loaded AFTER a file B, then
   * A.unique_id > B.unique_id.
   * Using this property, one might order files by order in which they were added.
   */
  unique_id: FileID;
  /** The filename that this file was uploaded under. */
  filename: string;
};
export function isInspecFile(f: any): f is InspecFile {
  const t = f as InspecFile;
  return t.filename !== undefined && t.unique_id !== undefined;
}

/** Represents a file containing an Inspec Execution output */
export type ExecutionFile = InspecFile & { execution: parse.AnyExec };
/** Represents a file containing an Inspec Profile (not run) */
export type ProfileFile = InspecFile & { profile: parse.AnyProfile };

export type FileLoadOptions = {
  /** The file to load */
  file: File;

  /** The unique id to grant it */
  unique_id: FileID;
};

export type TextLoadOptions = {
  /** The filename to denote this object with */
  filename: string;

  /** The unique id to grant it */
  unique_id: FileID;

  /** The text to use for it. */
  text: string;
};

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "intake"
})
class InspecIntakeModule extends VuexModule {
  /**
   * Load a file with the specified options. Promises an error message on failure
   */
  @Action
  async loadFile(options: FileLoadOptions): Promise<Error | null> {
    let read = read_file_async(options.file);
    return read
      .then(text =>
        this.loadText({
          text,
          unique_id: options.unique_id,
          filename: options.file.name
        })
      )
      .then(err => {
        return err;
      });
  }

  /*
   * Due to issues with catching errors from Actions, this function returns its
   * errors. null implies the text load was successful.
   */
  @Action
  async loadText(options: TextLoadOptions): Promise<Error | null> {
    // Fetch our data store
    const data = getModule(DataModule, Store);

    // Convert it
    let result: parse.ConversionResult;
    try {
      result = parse.convertFile(options.text);
    } catch (e) {
      return new Error(
        `Failed to convert file ${options.filename} due to error "${e}".`
      );
    }

    // Determine what sort of file we (hopefully) have, then add it
    if (result["1_0_ExecJson"]) {
      // Handle as exec
      let execution = result["1_0_ExecJson"];
      execution = Object.freeze(execution);
      let reportFile = {
        unique_id: options.unique_id,
        filename: options.filename,
        execution
      };
      data.addExecution(reportFile);
    } else if (result["1_0_ProfileJson"]) {
      // Handle as profile
      let profile = result["1_0_ProfileJson"];
      let profileFile = {
        unique_id: options.unique_id,
        filename: options.filename,
        profile
      };
      data.addProfile(profileFile);
    } else {
      return new Error("Couldn't parse data");
    }
    return null;
  }
}

export default InspecIntakeModule;

// Track granted file ids
let last_granted_unique_id: number = 0;

/**
 * Yields a guaranteed currently free file ID.
 * This is the computed as the highest currently held file id + 1
 * It does not "fill spaces" of closed files, so that in any given
 * session we will never repeat a file ID with a different file object.
 */
export function next_free_file_ID(): FileID {
  last_granted_unique_id += 1;
  return last_granted_unique_id;
}
