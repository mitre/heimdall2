import { InspecOutput, Profile } from "out/types.js";
import { generateNewNistHash, generatenewControlHash } from "out/nist.js";

export const store = {
    state: {
        // Counts of each status
        status: [
            ["Passed", 0],
            ["Failed", 0],
            ["Not Applicable", 0],
            ["Not Reviewed", 0],
            ["Profile Error", 0],
        ],

        // Counts of each impact
        impact: [
            ["low", 0], 
            ["medium", 0], 
            ["high", 0], 
            ["critical", 0]
        ],

        // Constant, and of the format [Name, Description, NumberOfChildren]
        // Each child is accordingly named to the format "{}-{}".format(Name, Index), where index \in [1, NumberofChildren]
        compliance: 0,
        status_filter: "none",
        impact_filter: "none",
        search_term: "",
        title: "",
        showing: "About",
        profile_name: "",
        version: "",
        controls: {},
        nist_hsh: {},
        controls_hsh: {},
        selected_family: "",
        selected_subfamily: "",
        selected_control: "",
    },
    reset() {
        (store.controls = {}), (store.compliance = 0);
        store.status = [
            ["Passed", 0],
            ["Failed", 0],
            ["Not Applicable", 0],
            ["Not Reviewed", 0],
            ["Profile Error", 0],
        ];
        store.impact = [
            ["low", 0],
            ["medium", 0],
            ["high", 0],
            ["critical", 0],
        ];
        store.getStatus();
        store.getImpact();
        store.getCompliance();
        store.setStatusFilter("none");
        store.setImpactFilter("none");
    },
    parseFile(content, file_name) {
        // Clear old controls
        for (var member in this.state.controls)
            delete this.state.controls[member];

        // Parse to json
        var json = JSON.parse(content);

        // Add all
        if (json.profiles == undefined) {
            // Is a profile? Interpret all controls
            profile = Profile(null, json);
            profile.controls.forEach(c => this.setControl(c))
        } else {
            // It's a result. Handle each profile in turn
            result = InspecOutput(json);
            result.profiles.forEach(profile => {
                profile.controls.forEach(c => this.setControl(c));
            })
        }
        this.setStatusFilter("");
        this.setImpactFilter("");
    },

    setControl(control) {
        // TODO: tweak
        this.state.controls[control.id] = control;
    },

    getBindValue() {
        return (
            this.getStatusFilter() +
            this.getImpactFilter() +
            this.getSearchTerm() +
            this.getSelectedFamily() +
            this.getSelectedSubFamily() +
            this.getSelectedControl()
        );
    },
    getControl(control_id) {
        return this.state.controls[control_id];
    },
    getControls() {
        var ctls = [];
        var ctl_id = this.getSelectedControl();
        if (ctl_id != "") {
            ctls.push(this.getControl(ctl_id));
            return ctls;
        } else {
            var impact_filter = this.getImpactFilter();
            var status_filter = this.getStatusFilter();
            var fam_filter = "";
            if (this.getSelectedSubFamily() != "") {
                fam_filter = this.getSelectedSubFamily();
            } else if (this.getSelectedFamily() != "") {
                fam_filter = this.getSelectedFamily();
            }
            var controls = this.state.controls;
            for (var ind in controls) {
                var nist_val = controls[ind].nist
                    ? controls[ind].nist.join()
                    : "UM-1";
                if (
                    status_filter == "" ||
                    status_filter == controls[ind].status
                ) {
                    if (
                        impact_filter == "" ||
                        impact_filter == controls[ind].severity
                    ) {
                        if (fam_filter == "" || nist_val.includes(fam_filter)) {
                            ctls.push(controls[ind]);
                        }
                    }
                }
            }
            let search = this.getSearchTerm();
            if (search == "") {
                return ctls;
            } else {
                return ctls.filter(function(ctl) {
                    return (
                        ctl.gid.toLowerCase().indexOf(search) !== -1 ||
                        ctl.rule_title.toLowerCase().indexOf(search) !== -1 ||
                        ctl.severity.toLowerCase().indexOf(search) !== -1 ||
                        ctl.status.toLowerCase().indexOf(search) !== -1 ||
                        ctl.finding_details.toLowerCase().indexOf(search) !==
                            -1 ||
                        ctl.code.toLowerCase().indexOf(search) !== -1
                    );
                });
            }
        }
    },

    getNistControls() {
        /**
         * Returns all of this objects controls filtered by the current filters
         */
        var impact_filter = this.getImpactFilter();
        var status_filter = this.getStatusFilter();
        var controls = this.state.controls;
        var ctls = [];
        for (var ind in controls) {
            if (status_filter == "" || status_filter == controls[ind].status) {
                if (
                    impact_filter == "" ||
                    impact_filter == controls[ind].severity
                ) {
                    ctls.push(controls[ind]);
                }
            }
        }
        let search = this.getSearchTerm();
        if (search == "") {
            return ctls;
        } else {
            return ctls.filter(function(ctl) {
                return (
                    ctl.gid.toLowerCase().indexOf(search) !== -1 ||
                    ctl.rule_title.toLowerCase().indexOf(search) !== -1 ||
                    ctl.severity.toLowerCase().indexOf(search) !== -1 ||
                    ctl.status.toLowerCase().indexOf(search) !== -1 ||
                    ctl.finding_details.toLowerCase().indexOf(search) !== -1 ||
                    ctl.code.toLowerCase().indexOf(search) !== -1
                );
            });
        }
    },
    setProfileName(name) {
        this.state.profile_name = name;
    },
    getProfileName() {
        return this.state.profile_name;
    },
    getStatus() {
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
    getTitle() {
        return this.state.title;
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
    getSelectedControl() {
        return this.state.selected_control;
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
