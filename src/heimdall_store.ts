import {
    ControlStatus,
    Severity,
    InspecOutput,
    Profile,
    Control,
} from "./types";
import {
    ControlNistHash,
    NistHash,
    generateNewControlHash,
    generateNewNistHash,
    ControlGroupStatus,
} from "./nist";
import { State } from "./store";

// These types are used for controls, etc.
// Mostly self explanatory

const STATUSES: ControlStatus[] = [
    "Passed",
    "Failed",
    "Not Applicable",
    "Not Reviewed",
    "Profile Error",
];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

// Used in the headers at the top counting statuses
type StatusCount = [ControlStatus, number];
type SeverityCount = [Severity, number];
type StatusHash = { [k in ControlStatus]: number };
type SeverityHash = { [k in Severity]: number };

// Used to track data in FilteredFamilies
type FilteredFamilyItem = {
    vuln_discuss: string;
    check_content: string;
    fix_text: string;
};
type FilteredFamilyCategory = { name: string; items: FilteredFamilyItem[] };
type FilteredFamily = {
    name: string;
    desc: string;
    items: FilteredFamilyCategory[];
};

class ControlFilter {
    /**
     * Holds the state of the control filters.
     * This is partially a misnomer because it does not include the family filters.
     * For whatever reason, there are separate functions (NI)
     */
    status: ControlStatus | null = null;
    severity: Severity | null = null;
    searchTerm: string | null = null;

    accepts(control: Control): boolean {
        /**
         * Returns true if the given control satisfies the status, impact, and search term filters
         */
        if (this.status && this.status != control.status) {
            return false;
        }
        // Must stringify the impact, but otherwise just check equality
        else if (this.severity && this.severity != control.severity) {
            return false;
        }
        // Finally, if there's a search term, we return based on that
        if (this.searchTerm) {
            let term = this.searchTerm.toLowerCase();
            // Check if any of the following list contain it, in lower case
            return [
                control.id,
                control.rule_title,
                control.severity,
                control.status,
                control.finding_details,
                control.code,
            ]
                .map(s => s.toLowerCase())
                .map(s => s.includes(term))
                .reduce((a, b) => a || b);
        } else {
            // No search term; we're fine
            return true;
        }
    }
}

export class HeimdallState extends State {
    /**
     * This subclass has data specifically useful for the heimdall site.
     * However, they may also be more broadly useful.
     * A goal for future work would be to make the site and the underlying data less tightly coupled.
     * But for now, we're just making a slot in replacement, not fiddling with the vue.
     */
    // These fields relate to the web-state visuals
    title: string = "";
    showing: string = "About";

    // These fields relate to the currently selected options
    selectedFamily: string | null = null; // The currently selected NIST family, if any
    selectedSubFamily: string | null = null; // The currently selected NIST category, if any
    selectedControlID: number | null = null; // The currently selected NIST control, if any. Value should be a unique ID, not the control ID
    filter: ControlFilter = new ControlFilter();

    // These fields are statistics/derived data of currently ingested report(s)/controls/profiles.
    // They are updated via the updateDerivedData function

    /* Data updating */

    getBindValue(): string {
        /**
         * Produce a string encoding the current state of user inputs on the site.
         * We watch for changes in this to determine whether or not to re-run.
         * Really just appends a bunch of strings together to form a more-or-less unique value.
         */
        return [
            this.filter.status,
            this.filter.severity,
            this.filter.searchTerm,
            this.selectedFamily,
            this.selectedSubFamily,
            this.selectedControlID,
        ]
            .map(v => v || "none")
            .join(";");
    }

    getCompliance(): number {
        /**
         * Computes the percent compliance of the (currently filtered) controls.
         */
        let statusHash = this.getStatusHash();
        let total =
            statusHash["Passed"] +
            statusHash["Failed"] +
            statusHash["Not Reviewed"] +
            statusHash["Profile Error"];
        return (100 * statusHash["Passed"]) / total;
    }

    getControlNistHash(): ControlNistHash {
        /**
         * Returns the control nist hash,
         * which is essentially a mapping of nist codes to
         * lists of relevant controls.
         */

        // Make an empty hash
        let controlNistHash: ControlNistHash = generateNewControlHash();

        // Get all of our controls as well, based on the status/severity/search BUT NOT selected family filters
        var controls = this.getNistControls();

        // For each control, go through its nist tags and put a reference to the control in the corresponding array of our controls hash
        controls.forEach(control => {
            control.tags.nist.forEach(tag => {
                if (tag in controlNistHash) {
                    controlNistHash[tag].push(control);
                } else {
                    controlNistHash[tag] = [control];
                }
            });
        });
        return controlNistHash;
    }

    getFilteredNistControls(): Control[] {
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
        // if we have one selected just set as that
        let selected = this.getSelectedControl();
        if (selected) {
            return [selected];
        }

        // Otherwise we just apply additional filtering to nist controls
        // Set our family filter to the subfamily if it is set, else the family
        let fam_filter: string | null = null;
        if (this.selectedSubFamily) {
            fam_filter = this.selectedSubFamily;
        } else if (this.selectedFamily) {
            fam_filter = this.selectedFamily;
        }

        // If we have a family filter, then build from nist controls.
        if (fam_filter) {
            let filteredNistControls: Control[] = [];
            this.getNistControls().forEach(control => {
                // Create a string of all the nist tags for searching
                let nist_val = control.tags.nist.join();

                // Verify that it includes our family filter
                if (nist_val.includes(fam_filter as string)) {
                    // The "as string" is necessary because we know fam_filter to be not null, but TypeScript can't tell
                    filteredNistControls.push(control);
                }
            });
            return filteredNistControls;
        } else {
            // If there is no family filter, then just make it the same as nistControls
            return this.getNistControls();
        }
    }

    getFilteredFamilies(): FilteredFamily[] {
        /**
         * The name here is a misnomer - nistHash already provides the filtered families.
         * What this does is provide a modified record structure of all currently visible controls, removing any empty families/categories,
         * as well as replacing each control with a slightly modified version. Unclear exactly why, but so it goes.
         * TODO: Figure out why the record needs to be in that particular format. On-site processing probably better
         */

        let filteredFamilies: FilteredFamily[] = [];

        // For each family, we want to explore its categories and
        this.getNistHash().children.forEach(family => {
            // This record tracks entries for each categories controls
            let categoryEntries: FilteredFamilyCategory[] = []; // TODO: properly annotate this type

            family.children.forEach(category => {
                let children: FilteredFamilyItem[] = [];

                category.children.forEach(control => {
                    // For some reason, we undo the earlier replacement of "\n" -> <br>
                    // We only need these parameters, and we deliberately avoid modifying the control itself
                    // TODO: As with the ControlHash in nist.ts, we would like to examine the possibility
                    //       of not having any special conversion occur here, instead using the control directly.
                    //       This would obviate this entire function (except for the debatable utility of clearing empty lists)
                    let modifiedControlHash: FilteredFamilyItem = {
                        vuln_discuss: control.vuln_discuss.replace(
                            /<br>/g,
                            "\n"
                        ),
                        check_content: control.tags.check_content.replace(
                            /<br>/g,
                            "\n"
                        ),
                        fix_text: control.tags.fix_text.replace(/<br>/g, "\n"),
                    };

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
    }

    getNistControls(): Control[] {
        /**
         * Returns a list of controls to show, based on factors such as filters, search terms, and current selections.
         * More specifically:
         * - If we have a search term, only return controls that contain that term
         * - If we have a impact filter, only return controls that match that filter
         * - If we have a status filter, only return controls that match that filter
         */

        // Begin with an empty list
        let nistControls: Control[] = [];

        // Now iterate over controls, adding only if they pass inspection
        this.getAllControls().forEach(control => {
            // Check that it matches our current filters. if so, add it
            if (this.filter.accepts(control)) {
                nistControls.push(control);
            }
        });

        return nistControls;
    }

    getNistHash(): NistHash {
        /**
         * Returns the nist hash, which is essentially just a categorization of controls by family/category.
         * See nist.ts for more involved documentation about what exactly it contains.
         */
        let nistHash: NistHash = generateNewNistHash();
        let controlNistHash = this.getControlNistHash();

        // Update the counts/statuses/values on each family, tracking a miniateurized version of each control
        // TODO: Determine whether this miniateurization is necessary. Hunch is no, and that it's just some back-compat stuff we could ez fix elsewhere. But we'll see
        nistHash.children.forEach(family => {
            // Track statuses for the family
            let familyStatuses: ControlGroupStatus[] = [];

            // Go through each family item
            family.children.forEach(category => {
                // Fetch the relevant controls
                let categoryControls = controlNistHash[category.name];

                // If they exist, we want a summary of their statuses and to count them as well
                if (categoryControls) {
                    // Track statuses for the category
                    let categoryStatuses: ControlStatus[] = [];

                    // Iterate over the controls we cached in the step before this in ctl_hash
                    categoryControls.forEach(control => {
                        // Save the status
                        categoryStatuses.push(control.status);

                        // Save the control
                        category.children.push(control);

                        // Count
                        category.count += 1;
                        family.count += 1;
                    });

                    // Finally, derive the status for the category, and track it in the family list
                    category.status = this.getStatusValue(categoryStatuses);
                    familyStatuses.push(category.status);
                }
            });

            // Store the summarized status
            family.status = this.getStatusValue(familyStatuses);
        });
        // Job's done
        return nistHash;
    }

    getStatusHash(): StatusHash {
        /**
         * Return the current status hash mapping statuses to control count.
         */
        let statusHash: StatusHash = {
            "Passed": 0,
            "Failed": 0,
            "Not Applicable": 0,
            "Not Reviewed": 0,
            "Profile Error": 0,
        };

        this.getFilteredNistControls().forEach((control: Control) => {
            statusHash[control.status] += 1;
        });
        return statusHash;
    }

    getSeverityHash(): SeverityHash {
        /**
         * Returns the current severity hash, mapping severities to control counts.
         */

        let severityHash: SeverityHash = {
            none: 0,
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
        };

        this.getFilteredNistControls().forEach((control: Control) => {
            severityHash[control.severity] += 1;
        });
        return severityHash;
    }

    getStatusCount(): StatusCount[] {
        /**
         * Return the current status counts, pairings of [Status, #ControlsWithThatStatus]
         */
        let statusCount: StatusCount[] = [];
        let statusHash = this.getStatusHash();
        STATUSES.forEach(status => {
            statusCount.push([status, statusHash[status]]);
        });
        return statusCount;
    }

    getSeverityCount(): SeverityCount[] {
        /**
         * * Return the current severity counts, pairings of [Severity, #ControlsWithThatSeverity]
         */
        // Build our severities
        let severityCount: SeverityCount[] = [];
        let severityHash = this.getSeverityHash();
        SEVERITIES.forEach(severity => {
            severityCount.push([severity, severityHash[severity]]);
        });
        return severityCount;
    }

    /* Data retreival */

    getSearchTerm(): string | null {
        /**
         * Returns the current search term.
         */
        return this.filter.searchTerm;
    }

    getSelectedControl(): Control | null {
        /**
         * Get the currently selected control, if there is one. Returns null if none
         */
        if (this.selectedControlID) {
            let found = this.getControlByUniqueID(this.selectedControlID);
            if (found === undefined) {
                console.error(
                    "Somehow user-selected control with id ${this.selectedControlID} does not exist"
                );
                return null;
            } else {
                return found;
            }
        } else {
            return null;
        }
    }

    getSelectedFamily(): string | null {
        /**
         * Returns the currently selected family
         */
        return this.selectedFamily;
    }

    getSelectedSubFamily(): string | null {
        /**
         * Returns the currently selected sub-family (or as I've taken to calling them, category)
         */
        return this.selectedSubFamily;
    }

    getSeverityFilter(): Severity | null {
        /**
         * Returns the current severity filter. Of debatable usefulness, but harmless.
         */
        return this.filter.severity;
    }

    getShowing(): string {
        /**
         * Returns the current showing data. I HIGHLY Suggest that this be moved to an independent Vuex state
         */
        return this.showing;
    }

    getStatusFilter(): ControlStatus | null {
        /**
         * Returns the current status filter. Of debatable usefulness, but harmless.
         */
        return this.filter.status;
    }

    getTitle(): string {
        /**
         * Returns the current title. TODO: Investigate ways to more simply setup these trivial getter/setter pairs, if such would be worthwhile
         */
        return this.title;
    }

    /* Data modification */

    setImpactFilter(val: string): void {
        /**
         * @deprecated Same reason as with get
         */
        this.setSeverityFilter(val as Severity);
    }

    setSearchTerm(val: string): void {
        /**
         * Sets the search term
         */
        this.filter.searchTerm = val;
    }

    setSelectedControl(val: number): void {
        /**
         * Sets the selected control id
         */
        this.selectedControlID = val;
    }

    setSelectedFamily(val: string): void {
        /**
         * Sets the selected family filter
         */
        this.selectedFamily = val;
    }

    setSelectedSubFamily(val: string): void {
        /**
         * Sets the selected subfamily filter
         */
        this.selectedSubFamily = val;
    }

    setSeverityFilter(val: Severity): void {
        /**
         * Sets our severity filter.
         * TODO: error checking
         */
        this.filter.severity = val;
    }

    setShowing(val: string): void {
        /**
         * Sets the current showing page item.
         * TODO: Make this strongly typed and in its own class. HeimdallState currently is a mess of different concepts.
         */
        this.showing = val;
    }

    setStatusFilter(val: ControlStatus): void {
        /**
         * Sets the status filter.
         * TODO: Error checking
         */
        this.filter.status = val;
    }

    setTitle(val: string): void {
        /**
         * Sets the title, and for some reason also the showing.
         */
        this.title = val;
    }

    reset(): void {
        /**
         * Deletes all data in the store and clears all filters
         */
        super.reset();
        // Simple - just wipe controls, and reset filters.
        // May need to modify this later. TODO
        this.filter = new ControlFilter();
        this.selectedControlID = null;
        this.selectedFamily = null;
        this.selectedSubFamily = null;
        this.title = "";
    }

    parseFile(content: string, file_name: string) {
        // Clear old controls
        this.reset();

        // Parse to json
        var json = JSON.parse(content);

        // Add all
        if (json.profiles == undefined) {
            // Is a profile? Interpret all controls
            let profile = new Profile(null, json);
            this.addInspecProfile(profile);
        } else {
            // It's a result. Handle each profile in turn
            let result = new InspecOutput(json);
            this.addInspecOutput(result);
        }

        // Reset our filters
        this.filter = new ControlFilter();
        this.selectedControlID = null;
        this.selectedFamily = null;
        this.selectedSubFamily = null;
    }

    private getStatusValue(statuses: ControlGroupStatus[]): ControlGroupStatus {
        /**
         * Sumarrizes an array of status into a single status
         */
        var fam_status: ControlGroupStatus = "Empty";
        if (statuses.includes("Failed")) {
            fam_status = "Failed";
        } else if (statuses.includes("Profile Error")) {
            fam_status = "Profile Error";
        } else if (statuses.includes("Not Reviewed")) {
            fam_status = "Not Reviewed";
        } else if (statuses.includes("Passed")) {
            fam_status = "Passed";
        } else if (statuses.includes("Not Applicable")) {
            fam_status = "Not Applicable";
        }
        return fam_status;
    }
}
