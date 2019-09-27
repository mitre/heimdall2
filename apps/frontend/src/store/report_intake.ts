/**
 * Reads and parses inspec files
 */

import { parse } from "inspecjs";
import { Module, VuexModule, getModule, Action } from "vuex-module-decorators";
import DataModule from "@/store/data_store";
import Store from "@/store/store";

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

export type LoadOptions = {
  /** The file to load */
  file: File;

  /** The unique id to grant it */
  unique_id: FileID;
};

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "intake"
})
class InspecIntakeModule extends VuexModule {
  /** Load a file with the specified options */
  @Action
  async loadFile(options: LoadOptions) {
    // Make the reader
    let reader = new FileReader();
    // Setup the callback
    reader.onload = (event: ProgressEvent) => {
      // Get our text
      const text = reader.result as string;

      // Fetch our data store
      const data = getModule(DataModule, Store);

      // Retrieve common elements for either case (profile or report)
      const filename = options.file.name;

      // Convert it
      let result: parse.ConversionResult;
      try {
        result = parse.convertFile(text);
      } catch (e) {
        console.error(
          `Failed to convert file ${filename} due to error "${e}". We should display this as an error modal.`
        );
        return;
      }

      // Determine what sort of file we (hopefully) have, then add it
      if (result["1_0_ExecJson"]) {
        // Handle as exec
        let execution = result["1_0_ExecJson"];
        execution = Object.freeze(execution);
        let reportFile = {
          unique_id: options.unique_id,
          filename,
          execution
        };
        data.addExecution(reportFile);
      } else if (result["1_0_ProfileJson"]) {
        // Handle as profile
        let profile = result["1_0_ProfileJson"];
        let profileFile = {
          unique_id: options.unique_id,
          filename,
          profile
        };
        data.addProfile(profileFile);
      } else {
        console.error(`Unhandled file type ${Object.keys(result)}`);
      }
    };

    // Dispatch the read
    reader.readAsText(options.file);
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
