/**
 * Tracks uploaded files, and their parsed contents
 */

import { Module, VuexModule, Mutation, Action } from "vuex-module-decorators";
import {
  HDFControl,
  parse,
  schemas_1_0,
  hdfWrapControl,
  ControlStatus
} from "inspecjs";
import { FileID, ExecutionFile, ProfileFile } from "@/store/report_intake";
import Store from "@/store/store";

// Alias some types
type Execution = parse.AnyExec;
type Profile = parse.AnyProfile;
type Control = parse.AnyFullControl;

type ExecProfile = schemas_1_0.ExecJSON.Profile;

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
// Essentially this is just describing the parent/child relationships each type has
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
    Extendable<ContextualizedControl> {
  /** The HDF version of this particular control */
  hdf: HDFControl;

  /** Drills down to this controls root CC. In general you should use this for all data operations */
  root: ContextualizedControl;

  /** Yields the full code of this control, by concatenating overlay code. */
  full_code: string;
}

class ContextualizedControlImp implements ContextualizedControl {
  // Imp stuff
  data: Control;
  sourced_from: ContextualizedProfile;
  extends_from: ContextualizedControl[];
  extended_by: ContextualizedControl[];
  hdf: HDFControl;

  constructor(
    data: Control,
    sourced_from: ContextualizedProfile,
    extended_by: ContextualizedControl[],
    extends_from: ContextualizedControl[]
  ) {
    // Simple save
    this.data = data;
    this.sourced_from = sourced_from;
    this.hdf = hdfWrapControl(data);
    this.extended_by = extended_by;
    this.extends_from = extends_from;
  }

  get root(): ContextualizedControl {
    let curr: ContextualizedControl = this;
    while (curr.extends_from.length) {
      curr = curr.extends_from[0];
    }
    return curr;
  }

  /** Returns whether this control is just a duplicate of base/root (but is not itself root) */
  get is_redundant(): boolean {
    return (
      !this.data.code ||
      this.data.code.trim() === "" ||
      (this.extends_from.length > 0 && this.data.code === this.root.data.code)
    );
  }

  get full_code(): string {
    // If we extend from something, we behave slightly differently
    if (this.extends_from.length) {
      let ancestor = this.extends_from[0];
      if (this.is_redundant) {
        return ancestor.full_code;
      } else {
        return `\
=========================================================
# Profile name: ${this.sourced_from.data.name}
=========================================================

${this.data.code}

${this.extends_from[0].full_code}`.trim();
      }
    } else {
      // We are the endpoint
      return `\
=========================================================
# Profile name: ${this.sourced_from.data.name}
=========================================================

${this.data.code}`.trim();
    }
  }
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
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
    readonly ContextualizedExecution[],
    readonly ContextualizedProfile[],
    readonly ContextualizedControl[]
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
        let as_exec = exec_files_profile.data as ExecProfile;

        // If it has a parent profile then we link them by extendedby/extendsfrom
        if (as_exec.parent_profile !== undefined) {
          // Look it up
          let parent = exec_file_context.contains.find(
            p => p.data.name === as_exec.parent_profile
          );

          // Link it up
          if (parent) {
            parent.extends_from.push(exec_files_profile);
            exec_files_profile.extended_by.push(parent);
          } else {
            console.warn(
              `Warning: Unable to find parent profile for profile ${as_exec.name} in spite of its attribute parent_profile: ${as_exec.parent_profile}. Verify data is properly structured`
            );
          }
        }
      });

      // Next step: Extract controls and connect them
      // Extract.
      let this_files_controls: ContextualizedControl[] = [];
      exec_file_context.contains.forEach(p => {
        let p_controls = p.data.controls as schemas_1_0.ExecJSON.Control[];
        p.contains = p_controls.map(c => {
          return new ContextualizedControlImp(c, p, [], []);
        });
        controls.push(...p.contains);
        this_files_controls.push(...p.contains);
      });

      // Link.
      this_files_controls.forEach(cc => {
        // Behaviour changes based on if we have well-formed or malformed profile dependency
        if (
          cc.sourced_from.extends_from.length ||
          cc.sourced_from.extended_by.length
        ) {
          // Our profile knows its relatives! We only need to check extends-from in this case
          // If we aren't extended from something we just drop. Our children will make connections for us
          if (cc.sourced_from.extends_from.length === 0) {
            return;
          }

          // Get the profile that this control's owning profile is extending
          let extended_profile = cc.sourced_from.extends_from[0]; // Only ever going to have 1 element, max

          // Hunt for its ancestor in the extended profile
          let ancestor = extended_profile.contains.find(
            c => c.data.id === cc.data.id
          );
          if (ancestor) {
            ancestor.extended_by.push(cc);
            cc.extends_from.push(ancestor);
            return;
          }
          // If it's not found, then we just assume it does not exist!
        } else {
          // If we don't have a normal profile dependency layout, then we have to hunt ye-olde-fashioned-way
          // Unfortunately, if theres more than 2 profiles there's ultimately no way to figure out which one was applied "last".
          // This method leaves them as siblings. However, as a fallback method that is perhaps the best we can hope for
          // First, hunt out all controls from this file that have the same id as cc
          let same_id = this_files_controls.filter(
            c => c.data.id === cc.data.id
          );
          // Find which of them, if any, is populated with results.
          let same_id_populated = same_id.find(
            c => c.hdf.segments && c.hdf.segments.length
          );

          // If found a populated base, use that. If not, we substitute in the first found element in same_id. This is arbitrary.
          if (!same_id_populated) {
            same_id_populated = same_id[0];
          }

          // If the object we end up with is "us", then just ignore
          if (Object.is(cc, same_id_populated)) {
            return;
          } else {
            // Otherwise, bind
            same_id_populated.extended_by.push(cc);
            cc.extends_from.push(same_id_populated);
          }
        }
      });
    });

    // Now we handle the independent profile (IE those in their own files, generated by inspec json).
    // These are slightly simpler because they do not actually include their overlays (even if they depend on them)
    // as a separate data structure.
    // As such, we can just do all the profile and controls from each in one fell swoop
    this.profileFiles.forEach(profile_file => {
      let profile_file_context: ContextualizedProfile = {
        data: profile_file.profile,
        sourced_from: profile_file,
        extended_by: [],
        extends_from: [],
        contains: []
      };
      profiles.push(profile_file_context);

      // Now give it it's controls
      let profile_controls = profile_file_context.data
        .controls as schemas_1_0.ProfileJSON.Control[];
      profile_controls.forEach(c => {
        let result = new ContextualizedControlImp(
          c,
          profile_file_context,
          [],
          []
        );
        profile_file_context.contains.push(result);
        controls.push(result);
      });
    });

    // Freeze them all (could we? should we? what does it matter? it shouldn't)
    return [executions, profiles, controls];
  }

  /**
   * Returns a readonly list of all executions currently held in the data store
   * including associated context
   */
  get contextualExecutions(): readonly ContextualizedExecution[] {
    return this.contextStore[0];
  }

  /**
   * Returns a readonly list of all profiles currently held in the data store
   * including associated context
   */
  get contextualProfiles(): readonly ContextualizedProfile[] {
    return this.contextStore[1];
  }

  /**
   * Returns a readonly list of all controls currently held in the data store
   * including associated context
   */
  get contextualControls(): readonly ContextualizedControl[] {
    return this.contextStore[2];
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
   * Unloads the file with the given id
   */
  @Mutation
  removeFile(file_id: FileID) {
    this.profileFiles = this.profileFiles.filter(
      pf => pf.unique_id !== file_id
    );
    this.executionFiles = this.executionFiles.filter(
      ef => ef.unique_id !== file_id
    );
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
