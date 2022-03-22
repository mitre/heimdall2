//  AZURE_TENANT_ID - The Azure Active Directory tenant (directory) ID.
//  AZURE_CLIENT_ID - The client (application) ID of an App Registration in the tenant.
//Environment variables used for client credential authentication:
//  AZURE_CLIENT_SECRET - A client secret that was generated for the App Registration.
//  AZURE_CLIENT_CERTIFICATE_PATH - The path to a PEM certificate to use during the authentication, instead of the client secret.
//Alternatively, users can provide environment variables for username and password authentication:
//  AZURE_USERNAME - Username to authenticate with.
//  AZURE_PASSWORD - Passord to authenticate with.
// This converter was written for: https://docs.microsoft.com/en-us/azure/governance/policy/samples/nist-sp-800-53-r4

import { DefaultAzureCredential } from "@azure/identity";
import { PolicyInsightsClient } from "@azure/arm-policyinsights";
import { PolicyClient } from "@azure/arm-policy";
import { ExecJSON } from 'inspecjs';
import { AzurePolicyMapping } from './mappings/AzurePolicyMapping';
import { version as HeimdallToolsVersion } from '../package.json';

// For troubleshooting API calls, uncomment below
//import { setLogLevel } from "@azure/logger"; // helps with troubleshooting
//setLogLevel("info");

var fs = require('fs');

// Load Azure Subscription ID as a variable from an OS environment variable.
let subscriptionId = "";
if (process.env["AZURE_SUBSCRIPTION_ID"] === undefined) {
    console.log("Error: Environment variable \"AZURE_SUBSCRIPTION_ID\" is undefined. Set this variable with the Azure Subscription Id.");
    process.exit(1);
} else {
    subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"]!;
}

// Create credential object. Reference the environment variable notes above.
const credential = new DefaultAzureCredential();
// Set HDF name and initialize AzurePolicyMapping object.
const NAME = "Azure Policy"
const AZURE_POLICY_MAPPING = new AzurePolicyMapping();

// Interfaces
// PolicyDefinition contains data used to populate HDF.
interface PolicyDefinition {
    id: string;
    subscriptionId: string;
    name?: string;
    detailedName?: string;
    description?: string;
    groupNames?: string[];
    state?: string;
    resources?: AzureResource[];
}
// AzureResource contains data about a specific Azure Resource (i.e. virtualMachine).
interface AzureResource {
    id: string;
    subscriptionId: string;
    type?: string;
    state?: string;
    location?: string;
}
// HDFResult contains data about a specific compliance test.
interface HDFResult {
    code_desc: string,
    run_time: number,
    skip_message: string,
    start_time: string,
    status: string
}

//Azure Policy Converter Class
class AzurePolicyConverter {
    //Class Variables
    results: ExecJSON.ControlResult[][];
    //Class Constructor
    // credential - Azure Credentials object to authenticate with.
    // subscriptionId - Subscription ID to query against.
    constructor(credential: DefaultAzureCredential, subscriptionId: string) {
        console.log("Generating HDF")
        this.results = [];
        this.toHDF(credential, subscriptionId);
    }

    //generateHDF
    // This main function pulls in data from Azure Policy and Azure Policy Insights and generates
    // a Heimdall Data Format file.
    // To Do: Add Try Catch and Error Handling
    private async toHDF(credential: DefaultAzureCredential, subscriptionId: string): Promise<PolicyDefinition[]> {
        const policyDefinitions: PolicyDefinition[] = [];
        const staticPolicyDefinitions: PolicyDefinition[] = [];
        // Array for holding Group Names (NIST mappings)
        let groupNames: string[] = [];
        // Flag for Policy Compliance State
        let complianceState = "";
        // Initalize Policy Insights Client
        const policyInsightsClient = new PolicyInsightsClient(credential, subscriptionId);
        // Initalize Policy Client
        const policyClient = new PolicyClient(credential, subscriptionId);


        for await (const policyState of policyInsightsClient.policyStates.listQueryResultsForSubscription('default', subscriptionId)) {
            // Reset Array for GroupNames
            groupNames = [];
            if (policyState.isCompliant !== undefined) {
                complianceState = policyState.isCompliant === false ? "noncompliant" : "compliant";
            } else {
                complianceState = "compliant"
            }

            // Loop through NIST 800-53 control mappings and add to groupNames list
            if (policyState.policyDefinitionGroupNames !== undefined) {
                policyState.policyDefinitionGroupNames.forEach((groupName) => {
                    groupNames.push(groupName);
                });
            }

            // Create AzureResource object
            const azureResource: AzureResource = {
                id: policyState.resourceId!,
                subscriptionId: subscriptionId,
                type: policyState.resourceType,
                state: complianceState,
                location: policyState.resourceLocation
            }

            // If policyDefinitions array doesn't contain current policyDefinition then add it
            if (policyDefinitions.findIndex(PolicyDefinition => PolicyDefinition.id === policyState.policyDefinitionId) === -1) {

                if (policyState.policyDefinitionId !== undefined) {
                    policyDefinitions.push({
                        id: policyState.policyDefinitionId,
                        subscriptionId: subscriptionId,
                        state: complianceState,
                        groupNames: this.parseGroupNames(groupNames || []),
                        resources: [azureResource]
                    })
                }
            } else {
                const policyDefinitionIndex = policyDefinitions.findIndex(PolicyDefinition => PolicyDefinition.id === policyState.policyDefinitionId)
                const resourceIndex = policyDefinitions[policyDefinitionIndex].resources?.findIndex(AzureResource => AzureResource.id === azureResource.id)

                if (resourceIndex === -1) {
                    policyDefinitions[policyDefinitionIndex].resources?.push(azureResource)
                }
            }



        }

        // Loop through each Policy and retrieve the metadata (name, description, etc.) associated with that policy.
        for (let i = 0; i < policyDefinitions.length; i++) {
            await this.delay(150);
            const policyAssignmentList = await policyClient.policyAssignments.getById(policyDefinitions[i].id);
            policyDefinitions[i].detailedName = policyAssignmentList.displayName;
            policyDefinitions[i].name = policyAssignmentList.name;
            policyDefinitions[i].description = policyAssignmentList.description;
        }

        // Get Static Policies that Microsoft is responsible for meeting NIST 800-53 controls.
        // Async pull static policies from the Policy Insights API
        const staticPolicies = [];
        for await (const item of policyClient.policyDefinitions.list({ filter: "policyType eq 'Static'" })) {
            staticPolicies.push(item);
        }
        await this.delay(150);

        for (let i = 0; i < staticPolicies.length; i++) {
            // Get Policy Details
            const policyAssignmentList = await policyClient.policyAssignments.getById(staticPolicies[i].id!);
            // Get Policy Control Mapping
            groupNames = AZURE_POLICY_MAPPING.nistFilter([policyAssignmentList.displayName!])!;
            if (groupNames === null || groupNames === undefined) {
                groupNames = []
            }

            const azureResource: AzureResource = {
                id: "Microsoft Managed",
                subscriptionId: subscriptionId,
                type: "N/A",
                state: "compliant",
                location: "N/A"
            }

            policyDefinitions.push({
                id: staticPolicies[i].id || "Not Available",
                subscriptionId: subscriptionId,
                detailedName: policyAssignmentList.displayName,
                name: policyAssignmentList.name,
                description: policyAssignmentList.description,
                groupNames: groupNames,
                state: "compliant",
                resources: [azureResource]
            })

        }

        const hdf: ExecJSON.Execution = {
            platform: {
                name: 'Heimdall Tools',
                release: HeimdallToolsVersion,
                target_id: ''
            },
            version: HeimdallToolsVersion,
            statistics: {
                //azure_policy_sdk_version: 1, // How do i get the sdk version?
                duration: null
            },
            profiles: [
                {
                    name: NAME,
                    version: '',
                    title: NAME,
                    maintainer: null,
                    summary: NAME,
                    license: null,
                    copyright: null,
                    copyright_email: null,
                    supports: [],
                    attributes: [],
                    depends: [],
                    groups: [],
                    status: 'loaded',
                    controls: await this.getControls(policyDefinitions),
                    sha256: ''
                }
            ]
        };

        hdf.profiles.forEach((profile) => {
        })

        //Testing writing to file
        var outputJson = JSON.stringify(hdf);
        fs.writeFile('azure-policy-test.json', outputJson, function (err: string) {
            if (err) throw err;
            console.log('complete');
        });

        return policyDefinitions;

    };

    private async getControls(policyDefinitions: PolicyDefinition[]): Promise<ExecJSON.Control[]> {
        let index = 0;

        return (await policyDefinitions).map((policyDefinition: PolicyDefinition) => {
            const control: ExecJSON.Control = {
                id: policyDefinition.name || '',
                title: policyDefinition.detailedName || '',
                desc: policyDefinition.description || null,
                impact: 0.5,
                tags: { nist: policyDefinition.groupNames },
                descriptions: [],//this.hdfDescriptions(issue),
                refs: [],
                source_location: { ref: policyDefinition.subscriptionId, line: 1 },
                code: '',
                results: this.getTestResults(policyDefinition)
            };
            index++;
            return control

        });
    }

    // Build Results
    private getTestResults(policyDefinition: PolicyDefinition) {
        let results: ExecJSON.ControlResult[] = [];
        if (policyDefinition.resources !== undefined) {
            for (let i = 0; i < policyDefinition.resources.length; i++) {
                let hdfResult: ExecJSON.ControlResult = {
                    code_desc: "Resource: " + policyDefinition.resources[i].id
                        + "\nType: " + policyDefinition.resources[i].type
                        + "\nLocation: " + policyDefinition.resources[i].location
                        + "\nSubscription: " + policyDefinition.resources[i].subscriptionId,
                    resource: policyDefinition.resources[i].id,
                    start_time: '',
                    run_time: 0.00,
                    status: this.getStatus(policyDefinition.resources[i].state!)
                };
                results.push(hdfResult)
            }

        }
        return results;
    }

    // Currently only parsing NIST groupNames
    // Add notes to explain parsing
    private parseGroupNames(groupNames: string[]) {
        let hdfTags: string[] = []
        let nistTag: string = ""
        if (groupNames !== undefined) {
            for (let i = 0; i < groupNames.length; i++) {
                if (groupNames[i].includes("nist")) {
                    nistTag = groupNames[i].substring(groupNames[i].lastIndexOf("_") + 1);
                    hdfTags.push(nistTag.charAt(0).toUpperCase() + nistTag.charAt(1).toUpperCase() + nistTag.slice(2))
                };
            };
        };
        if (hdfTags.length > 0) {
            return hdfTags;
        } else {
            return [];
        }

    };

    private getStatus(state: string): ExecJSON.ControlResultStatus {
        if (state === 'compliant') {
            return ExecJSON.ControlResultStatus.Passed;
        } else if (state === 'noncompliant') {
            return ExecJSON.ControlResultStatus.Failed;
        } else {
            return ExecJSON.ControlResultStatus.Skipped;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};

let azurePolicyConverter = new AzurePolicyConverter(credential, subscriptionId);