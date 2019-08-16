/**
 * Within this code we use the following nomenclature:
 * A "hash" isn't a hash in the sense of sha256 or whatever; it is simply a condensed representation for use in rendering.
 * A Family is the higher level grouping of NIST vulnerabilies. EG: AC, AU, AT, etc.
 * A Category is the subgrouping of Family. EG: AC-3, PM-15, etc.
 * A NistHash is a large record containing information about many families, and by extension their categories
 */

 import {ControlStatus, HDFControl} from "./compat-wrappers";

// Format is [Name, Description, NumberOfChildren]
export type NistFamilyDescription = [string, string, number];

const families: NistFamilyDescription[] = [
    ["UM", "Unmapped", 1],
    ["AC", "Access Control", 25],
    ["AU", "Audit and Accountability", 16],
    ["AT", "Awareness and Training", 5],
    ["CM", "Configuration Management", 11],
    ["CP", "Contingency Planning", 13],
    ["IA", "Identification and Authentication", 11],
    ["IR", "Incident Response", 10],
    ["MA", "Maintenance", 6],
    ["MP", "Media Protection", 8],
    ["PS", "Personnel Security", 8],
    ["PE", "Physical and Environmental Protection", 20],
    ["PL", "Planning", 9],
    ["PM", "Program Management", 16],
    ["RA", "Risk Assessment", 6],
    ["CA", "Security Assessment and Authorization", 9],
    ["SC", "System and Communications Protection", 44],
    ["SI", "System and Information Integrity", 17],
    ["SA", "System and Services Acquisition", 22],
];

// Our types to be layed out in our hashes

// Represents the status of a group of controsl. Typically holds the value of the "worst" control amongst the group
// Empty means no controls are in the given group
export type ControlGroupStatus = ControlStatus | "Empty";

// Holds all of the data related to a NIST vuln category, nested in a family. EX: RA-4, PM-12, etc.
export type NistCategory = {
    // Sometimes referred to as a subfamily
    name: string; // Derived from its parent, and the index it has amongst its parents children
    count: number; // How many controls it holds
    value: number; // Its value (?????)
    status: ControlGroupStatus; // The combined status of all it's members
    children: HDFControl[]; // The controls themselves
};

// Holds all of the data related to a NIST vuln vamily, EX: SC, SI, etc.
export type NistFamily = {
    name: string; // A name - 2 character NIST code.
    desc: string; // A description
    count: number; // How many categories it holds
    status: ControlGroupStatus; // The combined status of all it's members
    children: NistCategory[];
};

// Top level structure. Holds many families
export type NistHash = { 
    name: string; 
    children: NistFamily[];
    count: number;
    status: ControlGroupStatus; 
};

export type ControlHashItem = HDFControl[];
export type ControlNistHash = { [index: string]: ControlHashItem }; // Maps nist categories to lists of relevant controls

function generateNewNistFamily(fam: NistFamilyDescription): NistFamily {
    /* Creates an "empty" (IE 0 count everywhere) nist family hash based on a family description. */
    // Destructure the family to the relevant components
    let [name, description, num_children] = fam;

    // First we generate our children
    let fam_children: NistCategory[] = [];
    for (let i = 1; i <= num_children; i++) {
        fam_children.push({
            name: name + "-" + i,
            count: 0,
            value: 1,
            status: "Empty",
            children: [],
        });
    }

    // We then use those as our children for this family
    return {
        name: name,
        desc: description,
        count: 0,
        children: fam_children,
        status: "Empty",
    };
}

export function generateNewNistHash(): NistHash {
    /**
     *  Generate an "empty" (IE 0 count everywhere) hash of all the nist family descriptions in the global constant "families".
     */
    return {
        name: "NIST SP 800-53",
        children: families.map(f => generateNewNistFamily(f)),
        count: 0,
        status: "Empty"
    };
}

export function generateNewControlHash(): ControlNistHash {
    /**
     * Generate an "empty" (IE empty lists) hash of all the nist family subgroup names to be populated with controls.
     * Note that this is slightly more inefficient thatn if we just generated them while we made the nist hash, but it is
     * unlikely to have a significant impact
     */
    let result: ControlNistHash = {};
    for (let family of generateNewNistHash().children) {
        for (let familyItem of family.children) {
            let key: string = familyItem.name;
            result[key] = [];
        }
    }
    return result;
}

/**
 * Adds the given controls to the nist hash
 */
export function populateNistHash(controls: HDFControl[], hash: NistHash): void {
  // Add each control to the hash where appropriate
  controls.forEach(control => {
    control.fixed_nist_tags.forEach(tag => {
      // Split the tag into its corresponding parts
      let tag_family = tag.substr(0, 2);

      // Get the family (if it exists)
      let nist_family = hash.children.find(
        family => family.name === tag_family
      );
      if (nist_family === undefined) {
        console.warn(`Undefined nist family ${tag_family} in tag ${tag}`);
        return;
      }

      // Get the category (if it exists)
      let nist_category = nist_family.children.find(
        category => category.name === tag
      );
      if (nist_category === undefined) {
        console.warn(`Undefined nist category ${tag}.`);
        return;
      }

      // Add the control to the category
      nist_category.children.push(control);

      // Update counts
      nist_family.count += 1;
      nist_category.count += 1;
      hash.count += 1;

      // Update statuses
      hash.status = updateStatus(hash.status, control.status);
      nist_family.status = updateStatus(nist_family.status, control.status);
      nist_category.status = updateStatus(nist_category.status, control.status);
    });
  });
}

/** 
 * Computes the groups status having added control.
 * There's a natural precedence to statuses. 
 * For instance, we would not mark a group as Passed if we added a Failed.
 * Clearly "Empty" is the lowest precedence, as adding any control would wipe it out.
 * Following those we have "Not run" and then "No data", which are effectively just no status.
 * Next, we would have 
 */
function updateStatus(group: ControlGroupStatus, control: ControlStatus): ControlGroupStatus {
    const precedence: ControlGroupStatus[] = ["Empty", "From Profile", "No Data", "Not Applicable", "Profile Error", "Failed", "Passed", "Not Reviewed"];
    let i1 = precedence.indexOf(group);
    let i2 = precedence.indexOf(control);
    if(i2 > i1) {
        // Our new control has shifted the status!
        return control;
    } else {
        // Our existing group status was "greater"
        return group;
    }
}