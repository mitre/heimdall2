/**
 * Tracks uploaded files, and their parsed contents
 */

import { Module, VuexModule, Mutation, Action } from "vuex-module-decorators";
import {
  AnyExec as Execution,
  AnyProfile as Profile,
  AnyFullControl as Control,
  HDFControl
} from "inspecjs";
import {
  FileID,
  ExecutionFile,
  ProfileFile,
  InspecFile
} from "./report_intake";
import Store from "./store";
import { ExecJSONProfile } from "inspecjs/dist/generated-parsers/exec-json";

/**
 * Mixin type to express that this type wraps another data type to add additional fields,
 * without modifying the inner type.
 */
interface WrapsType<Data> {
  data: Data;
}

/**
 * Mixin type to express that this type has some sort "parent".
 * Sort of an inverse to the Contains mixin.
 * E.g. A control is sourced from a profile, and an execution is from a file.
 */
interface Sourced<From> {
  sourced_from: From;
}

/**
 * Mixin type to express that this type has some sort of directional dependency-graph with members of a (usually the same) type.
 * For instance, profiles overlay/are overlayed by profiles.
 * Controls override behavior/are overrideen by other controls
 */
interface Extendable<By> {
  /**
   * What is this data extended by?
   * E.g. a profile that overlays this profile.
   * Can be empty.
   */
  extended_by: By[];

  /**
   * What data is this node extending?
   * E.g. is this overlaying a profile? Another control?
   * Can be empty.
   */
  extends_from: By[];
}

/**
 * Mixin type to express that this type is primarily a parent to some other data.
 * For instance, profiles are most directly a parent of controls .
 * What objects/resources does this item contain?
 */
interface Contains<Item> {
  contains: Item;
}

// Create our three primary data types from the above mixins
export interface ContextualizedExecution
  extends WrapsType<Execution>,
    Sourced<ExecutionFile>,
    Contains<ContextualizedProfile[]> {}
export interface ContextualizedProfile
  extends WrapsType<Profile>,
    Sourced<ContextualizedExecution | ProfileFile>,
    Contains<ContextualizedControl[]>,
    Extendable<ContextualizedProfile> {}
export interface ContextualizedControl
  extends WrapsType<Control>,
    Sourced<ContextualizedProfile>,
    Extendable<ContextualizedControl> {}

@Module({
  namespaced: true,
  name: "data"
})
class InspecDataModule extends VuexModule {
  /** State var containing all execution files that have been added */
  executionFiles: ExecutionFile[] = [];

  /** State var containing all profile files that have been added */
  profileFiles: ProfileFile[] = [];

  /** Return all of the files that we currently have. */
  get allFiles(): (ExecutionFile | ProfileFile)[] {
    let result: (ExecutionFile | ProfileFile)[] = [];
    result.push(...this.executionFiles);
    result.push(...this.profileFiles);
    return result;
  }

  /**
   * Recompute all contextual data
   */
  get contextStore(): [
    ContextualizedExecution[],
    ContextualizedProfile[],
    ContextualizedControl[]
  ] {
    // Initialize all our arrays
    let executions: ContextualizedExecution[] = [];
    let profiles: ContextualizedProfile[] = [];
    let controls: ContextualizedControl[] = [];

    // First thing: initialize all of our data
    this.executionFiles.forEach(exec_file => {
      // Save the execution, initially empty and unrelated
      let exec_file_context: ContextualizedExecution = {
        data: exec_file.execution,
        sourced_from: exec_file,
        contains: []
      };
      executions.push(exec_file_context);

      // Save its profiles, again initially empty BUT related mutually to their containing execution
      exec_file.execution.profiles.forEach(exec_files_profile => {
        let exec_files_profile_context: ContextualizedProfile = {
          data: exec_files_profile,
          sourced_from: exec_file_context,
          extended_by: [],
          extends_from: [],
          contains: []
        };
        profiles.push(exec_files_profile_context);

        // Add it to our parent
        exec_file_context.contains.push(exec_files_profile_context);
      });

      // After our initial save of profiles, we go over them _again_ to establish parentage/dependency
      exec_file_context.contains.forEach(exec_files_profile => {
        // We know these are from a report; label as such
        let as_exec = exec_files_profile.data as ExecJSONProfile;
        // If it has a parent profile then we link them by extendedby/extendsfrom
        if (as_exec.parent_profile !== undefined) {
          // Look it up
          let parent = exec_file_context.contains.find(
            p => p.data.name === as_exec.parent_profile
          );

          // Link it up
          if (parent) {
            parent.extended_by.push(exec_files_profile);
            exec_files_profile.extends_from.push(parent);
          } else {
            console.warn(
              `Warning: Unable to find parent profile for profile ${as_exec.name} in spite of its attribute parent_profile: ${as_exec.parent_profile}. Verify data is properly structured`
            );
          }
        }
      });
    });

    // Now we handle the independent profile (IE those in their own files, generated by inspec json).
    // These are slightly simpler because they do not actually include their overlays (even if they depend on them)
    // as a separate data structure.
    this.profileFiles.forEach(profile_file => {
      let profile_file_context: ContextualizedProfile = {
        data: profile_file.profile,
        sourced_from: profile_file,
        extended_by: [],
        extends_from: [],
        contains: []
      };
      profiles.push(profile_file_context);
    });

    // At this point all executions/profiles are in, but none of their controls are.
    // Add them first, establishing the parent/child relationship while we do so
    profiles.forEach(profile_context => {
      profile_context.data.controls.forEach(profile_control => {
        let profile_control_context: ContextualizedControl = {
          data: profile_control,
          sourced_from: profile_context,
          extended_by: [],
          extends_from: []
        };
        profile_context.contains.push(profile_control_context);
        controls.push(profile_control_context);
      });
    });

    // Now one final step: pair up controls by their overlays.
    controls.forEach(control_context => {
      // We only care about controls who's profiles extend another profile.
      // What about if it is extended? Doesn't matter; handled elsewhere.
      let this_id = control_context.data.id;
      let parent_profile = control_context.sourced_from;
      parent_profile.extends_from.forEach(overlayed_profile => {
        // We want to find a control in overlayed_profile with the same id as
        let matching_control = overlayed_profile.contains.find(
          cc => cc.data.id === this_id
        );
        if (matching_control !== undefined) {
          // We've found one; interlink
          matching_control.extended_by.push(control_context);
          control_context.extends_from.push(matching_control);
        }
      });
    });

    return [executions, profiles, controls];
  }

  /**
   * Get executions as contextual items
   */
  get contextualExecutions(): ContextualizedExecution[] {
    return this.contextStore[0];
  }

  /**
   * Get overlay profiles, etc.
   */
  get contextualProfiles(): ContextualizedProfile[] {
    return this.contextStore[1];
  }

  /**
   * Get overlayed controls, etc.
   */
  get contextualControls(): ContextualizedControl[] {
    return this.contextStore[2];
  }

  /**
   * Yields a guaranteed currently free file ID
   */
  get nextFreeFileID(): FileID {
    let currentMax = 0;
    // If we have any files find the max among them
    if (this.allFiles.length) {
      currentMax = Math.max(...this.allFiles.map(f => f.unique_id));
    }
    return currentMax + 1;
  }

  /**
   * Adds a profile file to the store.
   * @param newProfile The profile to add
   */
  @Mutation
  addProfile(newProfile: ProfileFile) {
    this.profileFiles.push(newProfile);
  }

  /**
   * Adds an execution file to the store.
   * @param newExecution The execution to add
   */
  @Mutation
  addExecution(newExecution: ExecutionFile) {
    this.executionFiles.push(newExecution);
  }

  /**
   * Clear all stored data.
   */
  @Mutation
  reset() {
    this.profileFiles = [];
    this.executionFiles = [];
  }
}

export default InspecDataModule;
