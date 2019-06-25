/**
 * Within this code we use the following nomenclature:
 * A "hash" isn't a hash in the sense of sha256 or whatever; it is simply a condensed representation for use in rendering.
 * A Family is the higher level grouping of NIST vulnerabilies. EG: AC, AU, AT, etc.
 * A Category is the subgrouping of Family. EG: AC-3, PM-15, etc.
 * A NistHash is a large record containing information about many families, and by extension their categories
 */

 import {ControlStatus, Control} from "./types";

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
// TODO: Replace NistControlHash with just "ControL" if such is feasible

// Represents the status of a group of controsl. Typically holds the value of the "worst" control amongst the group
export type ControlGroupStatus = ControlStatus | "Empty";

// A peculiar type of seemingly indistinguishable utility from just using a Control. TODO: Decipher why. is it just the drilldown chart API demands it?
export type NistControlHash = {
    name: string; // The name of the control
    status: ControlStatus; // the status of the control
    value: number;
};

// Holds all of the data related to a NIST vuln category, nested in a family. EX: RA-4, PM-12, etc.
export type NistCategory = {
    // Sometimes referred to as a subfamily
    name: string; // Derived from its parent, and the index it has amongst its parents children
    count: number; // How many controls it holds
    value: number; // Its value (?????)
    status: ControlGroupStatus; // The combined status of all it's members
    children: Control[]; // The controls themselves
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
export type NistHash = { name: string; children: NistFamily[] };

export type ControlHashItem = Control[];
export type ControlHash = { [index: string]: ControlHashItem }; // Maps nist categories to lists of relevant controls

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
    };
}

export function generateNewControlHash(): ControlHash {
    /**
     * Generate an "empty" (IE empty lists) hash of all the nist family subgroup names to be populated with controls.
     * Note that this is slightly more inefficient thatn if we just generated them while we made the nist hash, but it is
     * unlikely to have a significant impact
     */
    let result: ControlHash = {};
    for (let family of generateNewNistHash().children) {
        for (let familyItem of family.children) {
            let key: string = familyItem.name;
            result[key] = [];
        }
    }
    return result;
}

/* ************************************************************************* */
/* **************************** Old Stuff ********************************** */
/* ************************************************************************* */

function getNist80053() {
    var nist = {
        name: "NIST SP 800-53",
        children: [
            {
                name: "UM",
                desc: "Unmapped",
                children: [
                    {
                        name: "UM-1",
                        value: 1,
                    },
                ],
            },
            {
                name: "AC",
                desc: "Access Control",
                children: [
                    {
                        name: "AC-1",
                        value: 1,
                    },
                    {
                        name: "AC-2",
                        value: 1,
                    },
                    {
                        name: "AC-3",
                        value: 1,
                    },
                    {
                        name: "AC-4",
                        value: 1,
                    },
                    {
                        name: "AC-5",
                        value: 1,
                    },
                    {
                        name: "AC-6",
                        value: 1,
                    },
                    {
                        name: "AC-7",
                        value: 1,
                    },
                    {
                        name: "AC-8",
                        value: 1,
                    },
                    {
                        name: "AC-9",
                        value: 1,
                    },
                    {
                        name: "AC-10",
                        value: 1,
                    },
                    {
                        name: "AC-11",
                        value: 1,
                    },
                    {
                        name: "AC-12",
                        value: 1,
                    },
                    {
                        name: "AC-13",
                        value: 1,
                    },
                    {
                        name: "AC-14",
                        value: 1,
                    },
                    {
                        name: "AC-15",
                        value: 1,
                    },
                    {
                        name: "AC-16",
                        value: 1,
                    },
                    {
                        name: "AC-17",
                        value: 1,
                    },
                    {
                        name: "AC-18",
                        value: 1,
                    },
                    {
                        name: "AC-19",
                        value: 1,
                    },
                    {
                        name: "AC-20",
                        value: 1,
                    },
                    {
                        name: "AC-21",
                        value: 1,
                    },
                    {
                        name: "AC-22",
                        value: 1,
                    },
                    {
                        name: "AC-23",
                        value: 1,
                    },
                    {
                        name: "AC-24",
                        value: 1,
                    },
                    {
                        name: "AC-25",
                        value: 1,
                    },
                ],
            },
            {
                name: "AU",
                desc: "Audit and Accountability",
                children: [
                    {
                        name: "AU-1",
                        value: 1,
                    },
                    {
                        name: "AU-2",
                        value: 1,
                    },
                    {
                        name: "AU-3",
                        value: 1,
                    },
                    {
                        name: "AU-4",
                        value: 1,
                    },
                    {
                        name: "AU-5",
                        value: 1,
                    },
                    {
                        name: "AU-6",
                        value: 1,
                    },
                    {
                        name: "AU-7",
                        value: 1,
                    },
                    {
                        name: "AU-8",
                        value: 1,
                    },
                    {
                        name: "AU-9",
                        value: 1,
                    },
                    {
                        name: "AU-10",
                        value: 1,
                    },
                    {
                        name: "AU-11",
                        value: 1,
                    },
                    {
                        name: "AU-12",
                        value: 1,
                    },
                    {
                        name: "AU-13",
                        value: 1,
                    },
                    {
                        name: "AU-14",
                        value: 1,
                    },
                    {
                        name: "AU-15",
                        value: 1,
                    },
                    {
                        name: "AU-16",
                        value: 1,
                    },
                ],
            },
            {
                name: "AT",
                desc: "Awareness and Training",
                children: [
                    {
                        name: "AT-1",
                        value: 1,
                    },
                    {
                        name: "AT-2",
                        value: 1,
                    },
                    {
                        name: "AT-3",
                        value: 1,
                    },
                    {
                        name: "AT-4",
                        value: 1,
                    },
                    {
                        name: "AT-5",
                        value: 1,
                    },
                ],
            },
            {
                name: "CM",
                desc: "Configuration Management",
                children: [
                    {
                        name: "CM-1",
                        value: 1,
                    },
                    {
                        name: "CM-2",
                        value: 1,
                    },
                    {
                        name: "CM-3",
                        value: 1,
                    },
                    {
                        name: "CM-4",
                        value: 1,
                    },
                    {
                        name: "CM-5",
                        value: 1,
                    },
                    {
                        name: "CM-6",
                        value: 1,
                    },
                    {
                        name: "CM-7",
                        value: 1,
                    },
                    {
                        name: "CM-8",
                        value: 1,
                    },
                    {
                        name: "CM-9",
                        value: 1,
                    },
                    {
                        name: "CM-10",
                        value: 1,
                    },
                    {
                        name: "CM-11",
                        value: 1,
                    },
                ],
            },
            {
                name: "CP",
                desc: "Contingency Planning",
                children: [
                    {
                        name: "CP-1",
                        value: 1,
                    },
                    {
                        name: "CP-2",
                        value: 1,
                    },
                    {
                        name: "CP-3",
                        value: 1,
                    },
                    {
                        name: "CP-4",
                        value: 1,
                    },
                    {
                        name: "CP-5",
                        value: 1,
                    },
                    {
                        name: "CP-6",
                        value: 1,
                    },
                    {
                        name: "CP-7",
                        value: 1,
                    },
                    {
                        name: "CP-8",
                        value: 1,
                    },
                    {
                        name: "CP-9",
                        value: 1,
                    },
                    {
                        name: "CP-10",
                        value: 1,
                    },
                    {
                        name: "CP-11",
                        value: 1,
                    },
                    {
                        name: "CP-12",
                        value: 1,
                    },
                    {
                        name: "CP-13",
                        value: 1,
                    },
                ],
            },
            {
                name: "IA",
                desc: "Identification and Authentication",
                children: [
                    {
                        name: "IA-1",
                        value: 1,
                    },
                    {
                        name: "IA-2",
                        value: 1,
                    },
                    {
                        name: "IA-3",
                        value: 1,
                    },
                    {
                        name: "IA-4",
                        value: 1,
                    },
                    {
                        name: "IA-5",
                        value: 1,
                    },
                    {
                        name: "IA-6",
                        value: 1,
                    },
                    {
                        name: "IA-7",
                        value: 1,
                    },
                    {
                        name: "IA-8",
                        value: 1,
                    },
                    {
                        name: "IA-9",
                        value: 1,
                    },
                    {
                        name: "IA-10",
                        value: 1,
                    },
                    {
                        name: "IA-11",
                        value: 1,
                    },
                ],
            },
            {
                name: "IR",
                desc: "Incident Response",
                children: [
                    {
                        name: "IR-1",
                        value: 1,
                    },
                    {
                        name: "IR-2",
                        value: 1,
                    },
                    {
                        name: "IR-3",
                        value: 1,
                    },
                    {
                        name: "IR-4",
                        value: 1,
                    },
                    {
                        name: "IR-5",
                        value: 1,
                    },
                    {
                        name: "IR-6",
                        value: 1,
                    },
                    {
                        name: "IR-7",
                        value: 1,
                    },
                    {
                        name: "IR-8",
                        value: 1,
                    },
                    {
                        name: "IR-9",
                        value: 1,
                    },
                    {
                        name: "IR-10",
                        value: 1,
                    },
                ],
            },
            {
                name: "MA",
                desc: "Maintenance",
                children: [
                    {
                        name: "MA-1",
                        value: 1,
                    },
                    {
                        name: "MA-2",
                        value: 1,
                    },
                    {
                        name: "MA-3",
                        value: 1,
                    },
                    {
                        name: "MA-4",
                        value: 1,
                    },
                    {
                        name: "MA-5",
                        value: 1,
                    },
                    {
                        name: "MA-6",
                        value: 1,
                    },
                ],
            },
            {
                name: "MP",
                desc: "Media Protection",
                children: [
                    {
                        name: "MP-1",
                        value: 1,
                    },
                    {
                        name: "MP-2",
                        value: 1,
                    },
                    {
                        name: "MP-3",
                        value: 1,
                    },
                    {
                        name: "MP-4",
                        value: 1,
                    },
                    {
                        name: "MP-5",
                        value: 1,
                    },
                    {
                        name: "MP-6",
                        value: 1,
                    },
                    {
                        name: "MP-7",
                        value: 1,
                    },
                    {
                        name: "MP-8",
                        value: 1,
                    },
                ],
            },
            {
                name: "PS",
                desc: "Personnel Security",
                children: [
                    {
                        name: "PS-1",
                        value: 1,
                    },
                    {
                        name: "PS-2",
                        value: 1,
                    },
                    {
                        name: "PS-3",
                        value: 1,
                    },
                    {
                        name: "PS-4",
                        value: 1,
                    },
                    {
                        name: "PS-5",
                        value: 1,
                    },
                    {
                        name: "PS-6",
                        value: 1,
                    },
                    {
                        name: "PS-7",
                        value: 1,
                    },
                    {
                        name: "PS-8",
                        value: 1,
                    },
                ],
            },
            {
                name: "PE",
                desc: "Physical and Environmental Protection",
                children: [
                    {
                        name: "PE-1",
                        value: 1,
                    },
                    {
                        name: "PE-2",
                        value: 1,
                    },
                    {
                        name: "PE-3",
                        value: 1,
                    },
                    {
                        name: "PE-4",
                        value: 1,
                    },
                    {
                        name: "PE-5",
                        value: 1,
                    },
                    {
                        name: "PE-6",
                        value: 1,
                    },
                    {
                        name: "PE-7",
                        value: 1,
                    },
                    {
                        name: "PE-8",
                        value: 1,
                    },
                    {
                        name: "PE-9",
                        value: 1,
                    },
                    {
                        name: "PE-10",
                        value: 1,
                    },
                    {
                        name: "PE-11",
                        value: 1,
                    },
                    {
                        name: "PE-12",
                        value: 1,
                    },
                    {
                        name: "PE-13",
                        value: 1,
                    },
                    {
                        name: "PE-14",
                        value: 1,
                    },
                    {
                        name: "PE-15",
                        value: 1,
                    },
                    {
                        name: "PE-16",
                        value: 1,
                    },
                    {
                        name: "PE-17",
                        value: 1,
                    },
                    {
                        name: "PE-18",
                        value: 1,
                    },
                    {
                        name: "PE-19",
                        value: 1,
                    },
                    {
                        name: "PE-20",
                        value: 1,
                    },
                ],
            },
            {
                name: "PL",
                desc: "Planning",
                children: [
                    {
                        name: "PL-1",
                        value: 1,
                    },
                    {
                        name: "PL-2",
                        value: 1,
                    },
                    {
                        name: "PL-3",
                        value: 1,
                    },
                    {
                        name: "PL-4",
                        value: 1,
                    },
                    {
                        name: "PL-5",
                        value: 1,
                    },
                    {
                        name: "PL-6",
                        value: 1,
                    },
                    {
                        name: "PL-7",
                        value: 1,
                    },
                    {
                        name: "PL-8",
                        value: 1,
                    },
                    {
                        name: "PL-9",
                        value: 1,
                    },
                ],
            },
            {
                name: "PM",
                desc: "Program Management",
                children: [
                    {
                        name: "PM-1",
                        value: 1,
                    },
                    {
                        name: "PM-2",
                        value: 1,
                    },
                    {
                        name: "PM-3",
                        value: 1,
                    },
                    {
                        name: "PM-4",
                        value: 1,
                    },
                    {
                        name: "PM-5",
                        value: 1,
                    },
                    {
                        name: "PM-6",
                        value: 1,
                    },
                    {
                        name: "PM-7",
                        value: 1,
                    },
                    {
                        name: "PM-8",
                        value: 1,
                    },
                    {
                        name: "PM-9",
                        value: 1,
                    },
                    {
                        name: "PM-10",
                        value: 1,
                    },
                    {
                        name: "PM-11",
                        value: 1,
                    },
                    {
                        name: "PM-12",
                        value: 1,
                    },
                    {
                        name: "PM-13",
                        value: 1,
                    },
                    {
                        name: "PM-14",
                        value: 1,
                    },
                    {
                        name: "PM-15",
                        value: 1,
                    },
                    {
                        name: "PM-16",
                        value: 1,
                    },
                ],
            },
            {
                name: "RA",
                desc: "Risk Assessment",
                children: [
                    {
                        name: "RA-1",
                        value: 1,
                    },
                    {
                        name: "RA-2",
                        value: 1,
                    },
                    {
                        name: "RA-3",
                        value: 1,
                    },
                    {
                        name: "RA-4",
                        value: 1,
                    },
                    {
                        name: "RA-5",
                        value: 1,
                    },
                    {
                        name: "RA-6",
                        value: 1,
                    },
                ],
            },
            {
                name: "CA",
                desc: "Security Assessment and Authorization",
                children: [
                    {
                        name: "CA-1",
                        value: 1,
                    },
                    {
                        name: "CA-2",
                        value: 1,
                    },
                    {
                        name: "CA-3",
                        value: 1,
                    },
                    {
                        name: "CA-4",
                        value: 1,
                    },
                    {
                        name: "CA-5",
                        value: 1,
                    },
                    {
                        name: "CA-6",
                        value: 1,
                    },
                    {
                        name: "CA-7",
                        value: 1,
                    },
                    {
                        name: "CA-8",
                        value: 1,
                    },
                    {
                        name: "CA-9",
                        value: 1,
                    },
                ],
            },
            {
                name: "SC",
                desc: "System and Communications Protection",
                children: [
                    {
                        name: "SC-1",
                        value: 1,
                    },
                    {
                        name: "SC-2",
                        value: 1,
                    },
                    {
                        name: "SC-3",
                        value: 1,
                    },
                    {
                        name: "SC-4",
                        value: 1,
                    },
                    {
                        name: "SC-5",
                        value: 1,
                    },
                    {
                        name: "SC-6",
                        value: 1,
                    },
                    {
                        name: "SC-7",
                        value: 1,
                    },
                    {
                        name: "SC-8",
                        value: 1,
                    },
                    {
                        name: "SC-9",
                        value: 1,
                    },
                    {
                        name: "SC-10",
                        value: 1,
                    },
                    {
                        name: "SC-11",
                        value: 1,
                    },
                    {
                        name: "SC-12",
                        value: 1,
                    },
                    {
                        name: "SC-13",
                        value: 1,
                    },
                    {
                        name: "SC-14",
                        value: 1,
                    },
                    {
                        name: "SC-15",
                        value: 1,
                    },
                    {
                        name: "SC-16",
                        value: 1,
                    },
                    {
                        name: "SC-17",
                        value: 1,
                    },
                    {
                        name: "SC-18",
                        value: 1,
                    },
                    {
                        name: "SC-19",
                        value: 1,
                    },
                    {
                        name: "SC-20",
                        value: 1,
                    },
                    {
                        name: "SC-21",
                        value: 1,
                    },
                    {
                        name: "SC-22",
                        value: 1,
                    },
                    {
                        name: "SC-23",
                        value: 1,
                    },
                    {
                        name: "SC-24",
                        value: 1,
                    },
                    {
                        name: "SC-25",
                        value: 1,
                    },
                    {
                        name: "SC-26",
                        value: 1,
                    },
                    {
                        name: "SC-27",
                        value: 1,
                    },
                    {
                        name: "SC-28",
                        value: 1,
                    },
                    {
                        name: "SC-29",
                        value: 1,
                    },
                    {
                        name: "SC-30",
                        value: 1,
                    },
                    {
                        name: "SC-31",
                        value: 1,
                    },
                    {
                        name: "SC-32",
                        value: 1,
                    },
                    {
                        name: "SC-33",
                        value: 1,
                    },
                    {
                        name: "SC-34",
                        value: 1,
                    },
                    {
                        name: "SC-35",
                        value: 1,
                    },
                    {
                        name: "SC-36",
                        value: 1,
                    },
                    {
                        name: "SC-37",
                        value: 1,
                    },
                    {
                        name: "SC-38",
                        value: 1,
                    },
                    {
                        name: "SC-39",
                        value: 1,
                    },
                    {
                        name: "SC-40",
                        value: 1,
                    },
                    {
                        name: "SC-41",
                        value: 1,
                    },
                    {
                        name: "SC-42",
                        value: 1,
                    },
                    {
                        name: "SC-43",
                        value: 1,
                    },
                    {
                        name: "SC-44",
                        value: 1,
                    },
                ],
            },
        ],
    };
    return nist;
}

function getNist() {
    var nist = {
        name: "flare",
        children: [
            {
                name: "analytics",
                children: [
                    {
                        name: "cluster",
                        children: [
                            { name: "AgglomerativeCluster", value: 3938 },
                            { name: "CommunityStructure", value: 3812 },
                            { name: "HierarchicalCluster", value: 6714 },
                            { name: "MergeEdge", value: 743 },
                        ],
                    },
                    {
                        name: "graph",
                        children: [
                            { name: "BetweennessCentrality", value: 3534 },
                            { name: "LinkDistance", value: 5731 },
                            { name: "MaxFlowMinCut", value: 7840 },
                            { name: "ShortestPaths", value: 5914 },
                            { name: "SpanningTree", value: 3416 },
                        ],
                    },
                    {
                        name: "optimization",
                        children: [{ name: "AspectRatioBanker", value: 7074 }],
                    },
                ],
            },
            {
                name: "animate",
                children: [
                    { name: "Easing", value: 17010 },
                    { name: "FunctionSequence", value: 5842 },
                    {
                        name: "interpolate",
                        children: [
                            { name: "ArrayInterpolator", value: 1983 },
                            { name: "ColorInterpolator", value: 2047 },
                            { name: "DateInterpolator", value: 1375 },
                            { name: "Interpolator", value: 8746 },
                            { name: "MatrixInterpolator", value: 2202 },
                            { name: "NumberInterpolator", value: 1382 },
                            { name: "ObjectInterpolator", value: 1629 },
                            { name: "PointInterpolator", value: 1675 },
                            { name: "RectangleInterpolator", value: 2042 },
                        ],
                    },
                    { name: "ISchedulable", value: 1041 },
                    { name: "Parallel", value: 5176 },
                    { name: "Pause", value: 449 },
                    { name: "Scheduler", value: 5593 },
                    { name: "Sequence", value: 5534 },
                    { name: "Transition", value: 9201 },
                    { name: "Transitioner", value: 19975 },
                    { name: "TransitionEvent", value: 1116 },
                    { name: "Tween", value: 6006 },
                ],
            },
            {
                name: "data",
                children: [
                    {
                        name: "converters",
                        children: [
                            { name: "Converters", value: 721 },
                            { name: "DelimitedTextConverter", value: 4294 },
                            { name: "GraphMLConverter", value: 9800 },
                            { name: "IDataConverter", value: 1314 },
                            { name: "JSONConverter", value: 2220 },
                        ],
                    },
                    { name: "DataField", value: 1759 },
                    { name: "DataSchema", value: 2165 },
                    { name: "DataSet", value: 586 },
                    { name: "DataSource", value: 3331 },
                    { name: "DataTable", value: 772 },
                    { name: "DataUtil", value: 3322 },
                ],
            },
            {
                name: "display",
                children: [
                    { name: "DirtySprite", value: 8833 },
                    { name: "LineSprite", value: 1732 },
                    { name: "RectSprite", value: 3623 },
                    { name: "TextSprite", value: 10066 },
                ],
            },
            {
                name: "flex",
                children: [{ name: "FlareVis", value: 4116 }],
            },
            {
                name: "physics",
                children: [
                    { name: "DragForce", value: 1082 },
                    { name: "GravityForce", value: 1336 },
                    { name: "IForce", value: 319 },
                    { name: "NBodyForce", value: 10498 },
                    { name: "Particle", value: 2822 },
                    { name: "Simulation", value: 9983 },
                    { name: "Spring", value: 2213 },
                    { name: "SpringForce", value: 1681 },
                ],
            },
            {
                name: "query",
                children: [
                    { name: "AggregateExpression", value: 1616 },
                    { name: "And", value: 1027 },
                    { name: "Arithmetic", value: 3891 },
                    { name: "Average", value: 891 },
                    { name: "BinaryExpression", value: 2893 },
                    { name: "Comparison", value: 5103 },
                    { name: "CompositeExpression", value: 3677 },
                    { name: "Count", value: 781 },
                    { name: "DateUtil", value: 4141 },
                    { name: "Distinct", value: 933 },
                    { name: "Expression", value: 5130 },
                    { name: "ExpressionIterator", value: 3617 },
                    { name: "Fn", value: 3240 },
                    { name: "If", value: 2732 },
                    { name: "IsA", value: 2039 },
                    { name: "Literal", value: 1214 },
                    { name: "Match", value: 3748 },
                    { name: "Maximum", value: 843 },
                    {
                        name: "methods",
                        children: [
                            { name: "add", value: 593 },
                            { name: "and", value: 330 },
                            { name: "average", value: 287 },
                            { name: "count", value: 277 },
                            { name: "distinct", value: 292 },
                            { name: "div", value: 595 },
                            { name: "eq", value: 594 },
                            { name: "fn", value: 460 },
                            { name: "gt", value: 603 },
                            { name: "gte", value: 625 },
                            { name: "iff", value: 748 },
                            { name: "isa", value: 461 },
                            { name: "lt", value: 597 },
                            { name: "lte", value: 619 },
                            { name: "max", value: 283 },
                            { name: "min", value: 283 },
                            { name: "mod", value: 591 },
                            { name: "mul", value: 603 },
                            { name: "neq", value: 599 },
                            { name: "not", value: 386 },
                            { name: "or", value: 323 },
                            { name: "orderby", value: 307 },
                            { name: "range", value: 772 },
                            { name: "select", value: 296 },
                            { name: "stddev", value: 363 },
                            { name: "sub", value: 600 },
                            { name: "sum", value: 280 },
                            { name: "update", value: 307 },
                            { name: "variance", value: 335 },
                            { name: "where", value: 299 },
                            { name: "xor", value: 354 },
                            { name: "_", value: 264 },
                        ],
                    },
                    { name: "Minimum", value: 843 },
                    { name: "Not", value: 1554 },
                    { name: "Or", value: 970 },
                    { name: "Query", value: 13896 },
                    { name: "Range", value: 1594 },
                    { name: "StringUtil", value: 4130 },
                    { name: "Sum", value: 791 },
                    { name: "Variable", value: 1124 },
                    { name: "Variance", value: 1876 },
                    { name: "Xor", value: 1101 },
                ],
            },
            {
                name: "scale",
                children: [
                    { name: "IScaleMap", value: 2105 },
                    { name: "LinearScale", value: 1316 },
                    { name: "LogScale", value: 3151 },
                    { name: "OrdinalScale", value: 3770 },
                    { name: "QuantileScale", value: 2435 },
                    { name: "QuantitativeScale", value: 4839 },
                    { name: "RootScale", value: 1756 },
                    { name: "Scale", value: 4268 },
                    { name: "ScaleType", value: 1821 },
                    { name: "TimeScale", value: 5833 },
                ],
            },
            {
                name: "util",
                children: [
                    { name: "Arrays", value: 8258 },
                    { name: "Colors", value: 10001 },
                    { name: "Dates", value: 8217 },
                    { name: "Displays", value: 12555 },
                    { name: "Filter", value: 2324 },
                    { name: "Geometry", value: 10993 },
                    {
                        name: "heap",
                        children: [
                            { name: "FibonacciHeap", value: 9354 },
                            { name: "HeapNode", value: 1233 },
                        ],
                    },
                    { name: "IEvaluable", value: 335 },
                    { name: "IPredicate", value: 383 },
                    { name: "IValueProxy", value: 874 },
                    {
                        name: "math",
                        children: [
                            { name: "DenseMatrix", value: 3165 },
                            { name: "IMatrix", value: 2815 },
                            { name: "SparseMatrix", value: 3366 },
                        ],
                    },
                    { name: "Maths", value: 17705 },
                    { name: "Orientation", value: 1486 },
                    {
                        name: "palette",
                        children: [
                            { name: "ColorPalette", value: 6367 },
                            { name: "Palette", value: 1229 },
                            { name: "ShapePalette", value: 2059 },
                            { name: "SizePalette", value: 2291 },
                        ],
                    },
                    { name: "Property", value: 5559 },
                    { name: "Shapes", value: 19118 },
                    { name: "Sort", value: 6887 },
                    { name: "Stats", value: 6557 },
                    { name: "Strings", value: 22026 },
                ],
            },
            {
                name: "vis",
                children: [
                    {
                        name: "axis",
                        children: [
                            { name: "Axes", value: 1302 },
                            { name: "Axis", value: 24593 },
                            { name: "AxisGridLine", value: 652 },
                            { name: "AxisLabel", value: 636 },
                            { name: "CartesianAxes", value: 6703 },
                        ],
                    },
                    {
                        name: "controls",
                        children: [
                            { name: "AnchorControl", value: 2138 },
                            { name: "ClickControl", value: 3824 },
                            { name: "Control", value: 1353 },
                            { name: "ControlList", value: 4665 },
                            { name: "DragControl", value: 2649 },
                            { name: "ExpandControl", value: 2832 },
                            { name: "HoverControl", value: 4896 },
                            { name: "IControl", value: 763 },
                            { name: "PanZoomControl", value: 5222 },
                            { name: "SelectionControl", value: 7862 },
                            { name: "TooltipControl", value: 8435 },
                        ],
                    },
                    {
                        name: "data",
                        children: [
                            { name: "Data", value: 20544 },
                            { name: "DataList", value: 19788 },
                            { name: "DataSprite", value: 10349 },
                            { name: "EdgeSprite", value: 3301 },
                            { name: "NodeSprite", value: 19382 },
                            {
                                name: "render",
                                children: [
                                    { name: "ArrowType", value: 698 },
                                    { name: "EdgeRenderer", value: 5569 },
                                    { name: "IRenderer", value: 353 },
                                    { name: "ShapeRenderer", value: 2247 },
                                ],
                            },
                            { name: "ScaleBinding", value: 11275 },
                            { name: "Tree", value: 7147 },
                            { name: "TreeBuilder", value: 9930 },
                        ],
                    },
                    {
                        name: "events",
                        children: [
                            { name: "DataEvent", value: 2313 },
                            { name: "SelectionEvent", value: 1880 },
                            { name: "TooltipEvent", value: 1701 },
                            { name: "VisualizationEvent", value: 1117 },
                        ],
                    },
                    {
                        name: "legend",
                        children: [
                            { name: "Legend", value: 20859 },
                            { name: "LegendItem", value: 4614 },
                            { name: "LegendRange", value: 10530 },
                        ],
                    },
                    {
                        name: "operator",
                        children: [
                            {
                                name: "distortion",
                                children: [
                                    { name: "BifocalDistortion", value: 4461 },
                                    { name: "Distortion", value: 6314 },
                                    { name: "FisheyeDistortion", value: 3444 },
                                ],
                            },
                            {
                                name: "encoder",
                                children: [
                                    { name: "ColorEncoder", value: 3179 },
                                    { name: "Encoder", value: 4060 },
                                    { name: "PropertyEncoder", value: 4138 },
                                    { name: "ShapeEncoder", value: 1690 },
                                    { name: "SizeEncoder", value: 1830 },
                                ],
                            },
                            {
                                name: "filter",
                                children: [
                                    { name: "FisheyeTreeFilter", value: 5219 },
                                    {
                                        name: "GraphDistanceFilter",
                                        value: 3165,
                                    },
                                    { name: "VisibilityFilter", value: 3509 },
                                ],
                            },
                            { name: "IOperator", value: 1286 },
                            {
                                name: "label",
                                children: [
                                    { name: "Labeler", value: 9956 },
                                    { name: "RadialLabeler", value: 3899 },
                                    { name: "StackedAreaLabeler", value: 3202 },
                                ],
                            },
                            {
                                name: "layout",
                                children: [
                                    { name: "AxisLayout", value: 6725 },
                                    { name: "BundledEdgeRouter", value: 3727 },
                                    { name: "CircleLayout", value: 9317 },
                                    {
                                        name: "CirclePackingLayout",
                                        value: 12003,
                                    },
                                    { name: "DendrogramLayout", value: 4853 },
                                    {
                                        name: "ForceDirectedLayout",
                                        value: 8411,
                                    },
                                    { name: "IcicleTreeLayout", value: 4864 },
                                    { name: "IndentedTreeLayout", value: 3174 },
                                    { name: "Layout", value: 7881 },
                                    {
                                        name: "NodeLinkTreeLayout",
                                        value: 12870,
                                    },
                                    { name: "PieLayout", value: 2728 },
                                    { name: "RadialTreeLayout", value: 12348 },
                                    { name: "RandomLayout", value: 870 },
                                    { name: "StackedAreaLayout", value: 9121 },
                                    { name: "TreeMapLayout", value: 9191 },
                                ],
                            },
                            { name: "Operator", value: 2490 },
                            { name: "OperatorList", value: 5248 },
                            { name: "OperatorSequence", value: 4190 },
                            { name: "OperatorSwitch", value: 2581 },
                            { name: "SortOperator", value: 2023 },
                        ],
                    },
                    { name: "Visualization", value: 16540 },
                ],
            },
        ],
    };
    return nist;
}
