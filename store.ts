/**
 * Remaining mysteries:
 * 
 * Where / how is status actually updated?
 */

 // These types track status and impact as a list. However, they're more of an "output" type
type StatusCount = [string, number];
type ImpactCount = [string, number];
// v These are the actual internal tracking types
type StatusHash = {
    "Passed": number,
    "Failed": number,
    "Not Applicable": number,
    "Not Reviewed": number,
    "Profile Error": number
}
type ImpactHash = {
    "low": number,
    "medium": number,
    "high": number,
    "critical": number
};

const STATUSES = [ "Passed", "Failed", "Not Applicable", "Not Reviewed", "Profile Error"];
const IMPACTS = ["low", "medium", "high", "critical"];

class ControlFilter {
    status: string | null = null;
    impact: string | null = null;
    search_term: string | null = null;

    accepts(control: Control): boolean {
        /**
         * Returns true if the given control satisfies the status, impact, and search term filters
         */
        if(this.status && this.status != control.status) {
            return false;
        }
        // Must stringify the impact, but otherwise just check equality
        else if(this.impact && this.impact != String(control.impact)) {
            return false;
        }
        // Finally, if there's a search term, we return based on that
        if(this.search_term) {
            let term = this.search_term.toLowerCase();
            // Check if any of the following list contain it, in lower case
            return [
                control.id,
                control.rule_title,
                control.severity,
                control.status,
                control.finding_details,
                control.code
            ].map(s => s.toLowerCase())
            .map(s => s.includes(term))
            .reduce((a, b) => a || b);
        } else {
            // No search term; we're fine
            return true;
        }
    }
}

class State {
    /**
     * This class contaisn functions for ingesting one or more reports, and querying/building statistics from them.
     */
    // These fields hold the currently ingested data
    controls: {[index:string] : Control} = {} ; // Maps control-id's to controls
    nist_hsh: NistHash | null = null;
    controls_hsh: ControlHash = {}; // Maps nist categories to lists of relevant controls
    // TODO: Keep reports/profiles instead of just throwing them out

    // These fields are statistics/data of currently ingested report(s). 
    // status and impacts aren't meant to be externally visible; use the properties status() and impact() for that
    _status: StatusHash;
    _impact: ImpactHash;

    constructor() {
        this._status = {
            "Passed": 0,
            "Failed": 0,
            "Not Applicable": 0,
            "Not Reviewed": 0,
            "Profile Error": 0
        };
        this._impact = {
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0
        };
    }

    get status(): StatusCount[] {
        // Build our statuses
        let statuses: StatusCount[] = [];
        for(let status in STATUSES) {
            statuses.push([status, 0]);
        }
        return statuses;
    }

    get impact(): ImpactCount[] {
        // Build our impacts
        let impacts: ImpactCount[] = [];
        for(let impact in IMPACTS) {
            impacts.push([impact, 0]);
        }
        return impacts;
    }

    addControl(con: Control) {
        /**
         * Add a control to the store.
         */
        this.controls[con.id] = con;
    }

    addInspecOutput(out: InspecOutput) {
        /**
         * Add an entire inspec run output to the store.
         */
        out.profiles.forEach(profile => {
            profile.controls.forEach(c => this.addControl(c));
        });
    }

    addInspecProfile(pro: Profile) {
        /**
         * Add an inspec profile to the store
         */
        pro.controls.forEach(c => this.addControl(c));
    }

    getControl(control_id: string): Control {
        /**
         * Retrieve the control with the provided ID. 
         * WARNING: Currently does not handle if the ID does not exist. Tread carefully
         */
        return this.controls[control_id];
    }

    get compliance(): number {
        /** Compute the compliance */
        return 100.0 * this.status["Passed"] / (this.status["Passed"] + this.status["Failed"] + this.status["Not Reviewed"] + this.status["Profile Error"]));
    }

    updateStatus() {
        var statusHash = {
            Passed: 0,
            Failed: 0,
            "Not Applicable": 0,
            "Not Reviewed": 0,
            "Profile Error": 0,
        };
        var controls = this.getControls();
        for (var index in controls) {
            statusHash[controls[index].status] += 1;
        }
        for (var i = 0; i < this.state.status.length; i++) {
            this.state.status[i][1] = statusHash[this.state.status[i][0]];
        }
        this.setCompliance(
            (statusHash["Passed"] /
                (statusHash["Passed"] +
                    statusHash["Failed"] +
                    statusHash["Not Reviewed"] +
                    statusHash["Profile Error"])) *
                100
        );
        return this.state.status;
    },
}

class HeimdallState extends State {
    /**
     * This subclass has data specifically useful for the heimdall site. 
     */
    // These fields relate to the web-state visuals
    title: string = "";
    showing: string = "About";

    // These fields relate to the currently selected options
    selected_family: string | null = null; // The currently selected NIST family, if any
    selected_subfamily: string | null = null; // The currently selected NIST category, if any
    selected_control: string | null = null; // The currently selected NIST control, if any
    filter: ControlFilter = new ControlFilter();

    getBindValue(): string {
        /**
         * Produce a string encoding the current state of user inputs on the site.
         * We watch for changes in this to determine whether or not to re-run.
         * Really just appends a bunch of strings together.
         */
        return [
            this.filter.status,
            this.filter.impact,
            this.filter.search_term,
            this.selected_family,
            this.selected_subfamily,
            this.selected_control,
        ].map(v => v || "none").join(";");
    }

    getSelectedControl(): Control | null {
        /**
         * Get the currently selected control, if there is one. Returns null if none
         */
        if(this.selected_control) {
            return this.controls[this.selected_control];
        }
        else {
            return null;
        }
    }
    getNistControls(): Control[] {
        /** 
         * Returns a list of controls to show, based on factors such as filters, search terms, and current selections.
         * More specifically: 
         * - If we have a selected control, return just that control instead
         * - If we have a search term, only return controls that contain that term
         * - If we have a impact filter, only return controls that match that filter
         * - If we have a status filter, only return controls that match that filter
         */

        // Begin with an empty list
        let controls: Control[] = []

        // Now iterate over controls, adding only if they pass inspection
        for(let control_id in this.controls) {
            let control = this.controls[control_id];

            // Check that it matches our current filters. if so, add it
            if(this.filter.accepts(control)) {
                controls.push(control);
            }
        }

        // Return the filled list
        return controls;
    }

    getFilteredControls(): Control[] {
        /**
         * This function is similar to getNistControls (and in fact USUALLY returns a subset of it).
         * However, it differs in the following two ways:
         * 1. If we have a control selected, then we only return that control in a one-item array
         * 2. If we have a family or subfamily filter, only return controls that meet the criteria 
         *    of getNistControls AND are relevant to that nist family/category
         * 
         * Rule #1 is somewhat odd in that it just completely ignores the getNistControls filters. 
         * If we have a selection, then that's what we return, full stop.
         */

        // if we have one selected just return that
        let selected = this.getSelectedControl();
        if (selected) {
            return [selected];
        }

        // Set our family filter to the subfamily if it is set, else the family
        let fam_filter: string | null = null;
        if (this.selected_subfamily) {
            fam_filter = this.selected_subfamily;
        } else if (this.selected_family) {
            fam_filter = this.selected_family;
        }

        // Call our "parent" function
        let controls = this.getNistControls();

        // if we have no family filter, then proceed as normal. Otherwise, filter by fam_filter
        if(fam_filter) {
            return controls.filter(control => {
                // Create a string of all the nist tags for searching
                let nist_val = control.tags.nist.join();

                // Verify that it includes our family filter
                return nist_val.includes(fam_filter as string); // The "as string" is necessary because we know fam_filter to be not null, but TypeScript can't tell
            });
        }
        else {
            return controls;
        }
    }
}

class Store {
    state: HeimdallState = new HeimdallState();

    reset() {
        // Simple - just re initialize the state
        this.state = new HeimdallState();
    }

    parseFile(content : string, file_name: string ) {
        // Clear old controls
        for (var member in this.state.controls)
            delete this.state.controls[member];

        // Parse to json
        var json = JSON.parse(content);

        // Add all
        if (json.profiles == undefined) {
            // Is a profile? Interpret all controls
            let profile = new Profile(null, json);
            this.state.addInspecProfile(profile);
        } else {
            // It's a result. Handle each profile in turn
            let result = new InspecOutput(json);
            this.state.addInspecOutput(result);
        }

        // Reset our filters
        this.state.filter.status = null;
        this.state.filter.impact = null;
    }
}

export const pillaged_store = {
    setStatus(val) {
        this.state.status = val;
    },
    getImpact() {
        var impactHash = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
        };
        var controls = this.getControls();
        for (var ind in controls) {
            impactHash[controls[ind].severity] += 1;
        }
        for (var i = 0; i < this.state.impact.length; i++) {
            this.state.impact[i][1] = impactHash[this.state.impact[i][0]];
        }
        return this.state.impact;
    },
    getCompliance() {
        return [["Data", this.state.compliance]];
    },
    setCompliance(val) {
        this.state.compliance = val;
    },
    setTitle(val) {
        this.state.title = val;
        this.state.showing = "Results";
    },
    getStatusFilter() {
        return this.state.status_filter;
    },
    setStatusFilter(val) {
        this.state.status_filter = val;
    },
    getImpactFilter() {
        return this.state.impact_filter;
    },
    setImpactFilter(val) {
        this.state.impact_filter = val;
    },
    getSelectedFamily() {
        return this.state.selected_family;
    },
    setSelectedFamily(val) {
        this.state.selected_family = val;
    },
    getSelectedSubFamily() {
        return this.state.selected_subfamily;
    },
    setSelectedSubFamily(val) {
        this.state.selected_subfamily = val;
    },
    setSelectedControl(val) {
        this.state.selected_control = val;
    },
    getSearchTerm() {
        if (this.state.search_term.length > 1) {
            return this.state.search_term;
        } else {
            return "";
        }
    },

    setSearchTerm(val) {
        this.state.search_term = val;
    },

    setNistHash() {
        // Generate a new empty nist hash to fill with data
        this.state.nist_hsh = generateNewNistHash();
        this.state.ctls_hsh = generatenewControlHash();
    },

    getNistHash() {
        /**
         * Rebuilds and returns the nist/ctrl hashes, which are essentially just categorization of each control by its Nist family/category
         * 
         * TODO: Unless it is explicitly necessary (something which I've seen absolutely no indication of), I would
         * highly recommend that we remove controls_hsh, and instead attempt to provide a mechanism by which we can quickly
         * filter all controls at once. somehow. It would be quite easy but we'd repeat a lot of work. Comes down to soundness vs efficiency
         */
        // Remake our hashes
        this.setNistHash();

        // Fetch our nist and control hashes
        var nistHash = this.state.nist_hsh;
        var ctls_hsh = this.state.controls_hsh;

        // Get all of our _filtered_ controls as well
        var controls = this.getNistControls();

        // For each control, go through its nist tags and put a reference to the control in the corresponding array of our controls hash
        controls.forEach(control => {
            if (control.nists) {
                control.nists.forEach(nist_code => {
                    var tag = nist_code.split(" ")[0];
                    if (tag in ctls_hsh) {
                        ctls_hsh[tag].push(control);
                    } else {
                        console.warn("Warning: unrecognized nist tag " + tag); // TODO: Just make the tag list here?
                    }
                });
            } else {
                // If uncategorized, put in UM-1
                ctls_hsh["UM-1"].push(controls[index]);
            }
        });

        // Next, we update the counts on each family, tracking a miniateurized version of each control
        nistHash.children.forEach(family => {
            // Track statuses for the family
            var familyStatuses = [];

            // Go through each family item
            family.children.forEach(category => {
                // Fetch the relevant controls
                categoryControls = ctls_hsh[category.name];

                // If they exist, we want a summary of their statuses and to count them as well
                if (categoryControls) {
                    // Track statuses for the category
                    var categoryStatuses = [];

                    // Iterate over the controls we cached in the step before this in ctl_hash
                    categoryControls.forEach(control => {
                        // Save the status
                        categoryStatuses.push(control.status);

                        // Make a simple representation of the control for our records
                        var controlHash = {
                            name: control.tags.gid,
                            status: control.status,
                            value: 1,
                        };

                        // Save and count
                        category.children.push(controlHash);
                        category.count += 1;
                        family.count += 1;
                    });

                    // Finally, derive the status for the category, and track it in the family list
                    category.status = this.getStatusValue(categoryStatuses);
                    familyStatuses.push(category.status);
                }
            });

            // Store the summarized status
            family.status = this.getStatusValue(fam_status);
        });

        // Job's done
        return hsh;
    },
    
    getFilteredFamilies() {
        /**
         * The name here is a misnomer - nistHash already provides the filtered families.
         * What this does is provide a modified record structure of all currently visible controls, removing any empty families/categories.
         */
        var nistHash = this.getNistHash();
        var filteredFamilies = [];

        // For each family, we want to explore its categories and 
        nistHash.children.forEach(family => {
            // This record tracks entries for each categories controls
            var categoryEntries = [];

            family.children.forEach(category => {
                var children = [];
                category.children.forEach(controlHash => {
                    var control = this.getControl(controlHash["name"]);

                    // For some reason, we undo the earlier replacement of "\n" -> <br>
                    // We only need these parameters, and we deliberately avoid modifying the control itself
                    // TODO: As with the ControlHash in nist.ts, we would like to examine the possibility
                    //       of not having any special conversion occur here, instead using the control directly.
                    //       This would obviate this entire function (except for the debatable utility of clearing empty lists)
                    var modifiedControlHash = {
                        vuln_discuss : control.vuln_discuss.replace( /<br>/g, "\n"),
                        check_content : control.check_content.replace( /<br>/g, "\n"),
                        fix_text : control.fix_text.replace( /<br>/g, "\n"),
                    }

                    // Push it in
                    children.push(modifiedControlHash);
                });

                // If we actually found any children, add this category to our list of listings to display for this family
                if (children) {
                    categoryEntries.push({
                        name: category.name,
                        items: children,
                    });
                }
            });

            // If any of our categories had
            if (categoryEntries.length > 0) {
                filteredFamilies.push({
                    name: family.name,
                    desc: family.desc,
                    items: categoryEntries,
                });
            }
        });

        return filteredFamilies;
    },

    getStatusValue(status_Ary) {
        /**
         * Sumarrizes an array of status into a single status
         */
        var fam_status = "Empty";
        if (status_Ary.includes("Failed")) {
            fam_status = "Failed";
        } else if (status_Ary.includes("Profile Error")) {
            fam_status = "Profile Error";
        } else if (status_Ary.includes("Not Reviewed")) {
            fam_status = "Not Reviewed";
        } else if (status_Ary.includes("Passed")) {
            fam_status = "Passed";
        } else if (status_Ary.includes("Not Applicable")) {
            fam_status = "Not Applicable";
        }
        return fam_status;
    },
};

export const store = new Store();