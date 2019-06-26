/**
 * Remaining tasks:
 * Make camel/snake case more universally consistent. I prefer camel.
 * Ascertain whether the condition that searches don't apply if they're only one character actually matters/should be kept.
 * Clean up old gross dict-typings, such as those in FilteredFamilies, that might be better suited to remain as Controls.
 * More documentation always good
 * Improve the invalidation schema. Currently separate getter/updater function. Vue does this with just an update function. How is this possible?
 *      Addendum to that: maybe find a way to represent chain dependencies.
 * Deduce the mysterious difference between getControls and getNISTControls. I'm fairly confident that I got the implementation correct, but why distinguish in the first place?
 * Test more.
 * Get rid of weird return types like in getCompliance. This will require me to edit vue. I relish the opportunity!
 *      This also applies to things like get/set severityFilter which should (obviously) take/yield a Severity type!
 *      However, it raises the issue of how do we deal with invalid inputs. in general we should warn and stuff if we get something that the system doesn't like!
 * Likewise ensure that getSelectedControl behaves as we expect it to in the face of invalid key (answer is: probably not!)
 *
 */

import {
    InspecOutput,
    Profile,
    Control,
} from "./types";

// Used to track whether data is currently valid
type Validity = "Valid" | "Invalid" | "InProgress";
export class State {
    /**
     * This class contaisn functions for ingesting one or more reports, and querying/building statistics from them.
     */
    // These fjields hold the currently ingested data
    protected allOutputs: InspecOutput[] = [];
    protected allProfiles: Profile[] = [];
    protected allControls: Control[] = [];

    // These are our derived fields
    protected outputIDHash: { [index: number]: InspecOutput } = {}; // Map's uniqueIDs to profiles. UniqueIDS change from run to run
    protected profileIDHash: { [index: number]: Profile } = {}; // Map's uniqueIDs to profiles. UniqueIDS change from run to run
    protected controlIDHash: { [index: number]: Control } = {}; // Maps uniqueIDs to controls. UniqueIDS change from run to run

    /* Data validity control */

    // This property tracks whether our current hashes are up to date
    // Has three states: Valid (no need to update) | Invalid (need to update) | InProgress (We haven't left the call)
    // InProgress is necessary so we don't get caught in a recursive loop
    private valid: Validity = "Invalid";

    // This function ensures that the State's "derived" values are kept up to date
    // Call it before each retreival
    protected assertValid() {
        if (this.valid != "Invalid") {
            return;
        } else {
            // Invalid: update everything
            this.valid = "InProgress";
            this.updateDerivedData();
            this.valid = "Valid";
        }
    }

    protected updateDerivedData() {}

    // Call it after each data modification
    invalidate() {
        // Don't want to mess with InProgress data. Just be careful to not mess with the flow overmuch
        if (this.valid == "Valid") {
            this.valid = "Invalid";
        }
    }

    /* Data modification */

    private addControl(con: Control) {
        /**
         * Add a control to the store.
         */
        this.allControls.push(con);
        this.controlIDHash[con.unique_id] = con;
    }

    addInspecOutput(out: InspecOutput) {
        /**
         * Add an entire inspec run output to the store.
         */
        this.invalidate();
        this.allOutputs.push(out);
        this.outputIDHash[out.unique_id] = out;
        out.profiles.forEach(profile => this.addInspecProfile(profile));
    }

    addInspecProfile(pro: Profile) {
        /**
         * Add an inspec profile to the store
         */
        this.invalidate();
        this.allProfiles.push(pro);
        this.profileIDHash[pro.unique_id] = pro;
        pro.controls.forEach(c => this.addControl(c));
    }

    reset(): void {
        /**
         * Clear all interred data
         */
        this.allControls = [];
        this.allProfiles = [];
        this.allOutputs = [];
        this.outputIDHash = {};
        this.profileIDHash = {};
        this.controlIDHash = {};
        this.invalidate();
    }

    /* Data retreival */

    getAllControls(): Control[] {
        /**
         * Returns all of the controls we have as a single list, unfiltered.
         * Do not edit these - treat them as read only.
         */
        this.assertValid();
        return this.allControls;
    }

    getAllProfiles(): Profile[] {
        /**
         * Returns all of the profiles we have currently as a single list, unfiltered.
         * Do not edit these - treat them as read only.
         */
        this.assertValid();
        return this.allProfiles;
    }

    getAllOutputs(): InspecOutput[] {
        /**
         * Returns all of the outputs we have currently as a single list, unfiltered.
         * Do not edit these - treat thema s read only.
         */
        this.assertValid();
        return this.allOutputs;
    }

    getControlByUniqueID(uniqueId: number): Control | undefined {
        /**
         * Returns the control with the given unique ID, if it exists
         */
        this.assertValid();
        return this.controlIDHash[uniqueId];
    }

    getProfileByUniqueID(uniqueId: number): Profile | undefined {
        /**
         * Returns the profile with the given unique ID, if it exists
         */
        this.assertValid();
        return this.profileIDHash[uniqueId];
    }

    getOutputByUniqueID(uniqueId: number): InspecOutput | undefined {
        /**
         * Returns the output with the given unique ID, if it exists
         */
        this.assertValid();
        return this.outputIDHash[uniqueId];
    }
}
