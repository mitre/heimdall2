/**
 * Remaining tasks:
 * Make camel/snake case more universally consistent. I prefer camel on methods, snake on properties.
 * Clean up old gross dict-typings, such as those in FilteredFamilies, that might be better suited to remain as Controls.
 * More documentation always good
 * Improve the invalidation schema. Currently separate getter/updater function. Vue does this with just an update function. How is this possible?
 *      Addendum to that: maybe find a way to represent chain dependencies.
 * Test more.
 * Get rid of weird return types like in getCompliance. This will require me to edit vue. I relish the opportunity!
 *      This also applies to things like get/set severityFilter which should (obviously) take/yield a Severity type!
 *      However, it raises the issue of how do we deal with invalid inputs. in general we should warn and stuff if we get something that the system doesn't like!
 * Likewise ensure that getSelectedControl behaves as we expect it to in the face of invalid key (answer is: probably not!)
 *
 *
 */

import { InspecOutput, Profile, Control } from "./types";

/**
 * This class contaisn functions for ingesting one or more reports, and querying/building statistics from them.
 */
export class State {
    // These fjields hold the currently ingested data
    protected allOutputs: InspecOutput[] = [];
    protected allProfiles: Profile[] = [];
    protected allControls: Control[] = [];

    // These are our derived fields
    protected outputIDHash: { [index: number]: InspecOutput } = {}; // Map's uniqueIDs to profiles. UniqueIDS change from run to run
    protected profileIDHash: { [index: number]: Profile } = {}; // Map's uniqueIDs to profiles. UniqueIDS change from run to run
    protected controlIDHash: { [index: number]: Control } = {}; // Maps uniqueIDs to controls. UniqueIDS change from run to run

    /* Data modification */

    /**
     * Add a control to the store.
     */
    private addControl(con: Control) {
        this.allControls.push(con);
        this.controlIDHash[con.unique_id] = con;
    }

    /**
     * Add an entire inspec run output to the store.
     */
    addInspecOutput(out: InspecOutput) {
        this.allOutputs.push(out);
        this.outputIDHash[out.unique_id] = out;
        out.profiles.forEach(profile => this.addInspecProfile(profile));
    }

    /**
     * Add an inspec profile to the store
     */
    addInspecProfile(pro: Profile) {
        this.allProfiles.push(pro);
        this.profileIDHash[pro.unique_id] = pro;
        pro.controls.forEach(c => this.addControl(c));
    }

    /**
     * Clear all interred data
     */
    reset(): void {
        this.allControls = [];
        this.allProfiles = [];
        this.allOutputs = [];
        this.outputIDHash = {};
        this.profileIDHash = {};
        this.controlIDHash = {};
    }

    /* Data retreival */

    /**
     * Returns all of the controls we have as a single list, unfiltered.
     * Do not edit these - treat them as read only.
     */
    getAllControls(): Control[] {
        return this.allControls;
    }

    /**
     * Returns all of the profiles we have currently as a single list, unfiltered.
     * Do not edit these - treat them as read only.
     */
    getAllProfiles(): Profile[] {
        return this.allProfiles;
    }

    /**
     * Returns all of the outputs we have currently as a single list, unfiltered.
     * Do not edit these - treat thema s read only.
     */
    getAllOutputs(): InspecOutput[] {
        return this.allOutputs;
    }

    /**
     * Returns the control with the given unique ID, if it exists
     */
    getControlByUniqueID(uniqueId: number): Control | undefined {
        return this.controlIDHash[uniqueId];
    }

    /**
     * Returns the profile with the given unique ID, if it exists
     */
    getProfileByUniqueID(uniqueId: number): Profile | undefined {
        return this.profileIDHash[uniqueId];
    }

    /**
     * Returns the output with the given unique ID, if it exists
     */
    getOutputByUniqueID(uniqueId: number): InspecOutput | undefined {
        return this.outputIDHash[uniqueId];
    }
}
