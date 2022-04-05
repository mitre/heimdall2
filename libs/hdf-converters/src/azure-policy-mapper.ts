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
//import { setLogLevel } from "@azure/logger";
//setLogLevel("info");

var fs = require('fs');

// Load Azure Subscription ID as a variable from an OS environment variable.
let subscriptionId = "";
if (process.env["AZURE_SUBSCRIPTION_ID"] === undefined) {
    console.log("Error: Environment variable \"AZURE_SUBSCRIPTION_ID\" is undefined. Set this variable with the Azure Subscription Id.");
    process.exit(1);
} else {
    subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];
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
    policyDefinitions: PolicyDefinition[] = [];
    //Class Flags
    staticPoliciesComplete = false;
    dynamicPoliciesComplete = false;
    //Class Constructor
    // credential - Azure Credentials object to authenticate with.
    // subscriptionId - Subscription ID to query against.
    constructor() {
        console.log("Generating HDF")
        this.results = [];
        this.toHDF();
    }

    //generateHDF
    // This main function pulls in data from Azure Policy and Azure Policy Insights and generates
    // a Heimdall Data Format file.
    // To Do: Add Try Catch and Error Handling
    private async toHDF(): Promise<PolicyDefinition[]> {

        const staticPolicyDefinitions: PolicyDefinition[] = [];
        // Initalize Policy Insights Client
        const policyInsightsClient = new PolicyInsightsClient(credential, subscriptionId);
        // Initalize Policy Client
        const policyClient = new PolicyClient(credential, subscriptionId);

        this.getDynamicPolicies(policyClient, policyInsightsClient);

        while (this.dynamicPoliciesComplete === false) {
            console.log("Waiting for dynamic policies..")
            await this.delay(1000);
        }
        // ---

        this.getStaticPolicies(policyClient);

        // ---

        while (this.staticPoliciesComplete === false) {
            console.log("Waiting for static policies..")
            await this.delay(5000);
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
                    controls: await this.getControls(this.policyDefinitions),
                    sha256: ''
                }
            ]
        }

        // ---

        this.writeHdf(hdf)

        return this.policyDefinitions;
    }

    // Get Dynamic Policies
    private async getDynamicPolicies(policyClient: PolicyClient, policyInsightsClient: PolicyInsightsClient) {
        // Array for holding Group Names (NIST mappings)
        let groupNames: string[] = [];
        // Flag for Policy Compliance State
        let complianceState = "";

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
                id: policyState.resourceId || "Not Available",
                subscriptionId: subscriptionId,
                type: policyState.resourceType,
                state: complianceState,
                location: policyState.resourceLocation
            }

            // If policyDefinitions array doesn't contain current policyDefinition then add it
            if (this.policyDefinitions.findIndex(PolicyDefinition => PolicyDefinition.id === policyState.policyDefinitionId) === -1) {

                if (policyState.policyDefinitionId !== undefined) {
                    this.policyDefinitions.push({
                        id: policyState.policyDefinitionId,
                        subscriptionId: subscriptionId,
                        state: complianceState,
                        groupNames: this.parseGroupNames(groupNames || []),
                        resources: [azureResource]
                    })
                }
            } else {
                const policyDefinitionIndex = this.policyDefinitions.findIndex(PolicyDefinition => PolicyDefinition.id === policyState.policyDefinitionId)
                const resourceIndex = this.policyDefinitions[policyDefinitionIndex].resources?.findIndex(AzureResource => AzureResource.id === azureResource.id)

                if (resourceIndex === -1) {
                    this.policyDefinitions[policyDefinitionIndex].resources?.push(azureResource)
                }
            }

        }

        console.log("TEST")
        // Loop through each Policy and retrieve the metadata (name, description, etc.) associated with that policy.
        for (const policyDefinition of this.policyDefinitions) {
            await this.delay(150);
            const policyAssignmentList = await policyClient.policyAssignments.getById(policyDefinition.id);
            policyDefinition.detailedName = policyAssignmentList.displayName;
            policyDefinition.name = policyAssignmentList.name;
            policyDefinition.description = policyAssignmentList.description;
        }
        this.dynamicPoliciesComplete = true;
        console.log("Dynamic Policies Complete")

    }

    // Get Static Policies
    private async getStaticPolicies(policyClient: PolicyClient) {
        // Get Static Policies that Microsoft is responsible for meeting NIST 800-53 controls.
        // Async pull static policies from the Policy Insights API
        const staticPolicies = [];
        let groupNames: string[] = [];

        for await (const item of policyClient.policyDefinitions.list({ filter: "policyType eq 'Static'" })) {
            staticPolicies.push(item);
        }

        // ---

        for (const staticPolicy of staticPolicies) {
            // Get Policy Details
            if (staticPolicy.id) {
                const policyAssignmentList = await policyClient.policyAssignments.getById(staticPolicy.id);

                // Get Policy Control Mapping
                if (policyAssignmentList.displayName) {
                    groupNames = AZURE_POLICY_MAPPING.nistFilter([policyAssignmentList.displayName]) || [""];
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

                    this.policyDefinitions.push({
                        id: staticPolicy.id || "Not Available",
                        subscriptionId: subscriptionId,
                        detailedName: policyAssignmentList.displayName,
                        name: policyAssignmentList.name,
                        description: policyAssignmentList.description,
                        groupNames: groupNames,
                        state: "compliant",
                        resources: [azureResource]
                    })
                }
            }

        }
        this.staticPoliciesComplete = true;
        console.log("Static Policies Complete")
    }

    private async getControls(policyDefinitions: PolicyDefinition[]): Promise<ExecJSON.Control[]> {
        return (policyDefinitions).map((policyDefinition: PolicyDefinition) => {
            const control: ExecJSON.Control = {
                id: policyDefinition.name || '',
                title: policyDefinition.detailedName || '',
                desc: policyDefinition.description || null,
                impact: 0.5,
                tags: { nist: policyDefinition.groupNames },
                descriptions: [],
                refs: [],
                source_location: { ref: policyDefinition.subscriptionId, line: 1 },
                code: '',
                results: this.getTestResults(policyDefinition)
            }
            return control
        })
    }

    // Build Results
    // Information about Azure Resource is in the code_desc
    private getTestResults(policyDefinition: PolicyDefinition) {
        const results: ExecJSON.ControlResult[] = [];
        if (policyDefinition.resources) {
            for (const resource of policyDefinition.resources) {
                const hdfResult: ExecJSON.ControlResult = {
                    code_desc: `Resource: ${resource.id}`
                        + `\nType: ${resource.type}`
                        + `\nLocation: ${resource.location}`
                        + `\nSubscription: ${resource.subscriptionId}`,
                    resource: resource.id,
                    start_time: '',
                    run_time: 0.00,
                    status: this.getStatus(resource.state || "noncompliant")
                }
                results.push(hdfResult)
            }

        }
        return results;
    }

    // Currently only parsing NIST groupNames
    // Add notes to explain parsing
    private parseGroupNames(groupNames: string[]) {
        const hdfTags: string[] = []
        let nistTag = ""
        if (groupNames) {
            for (const groupName of groupNames) {
                if (groupName.includes("nist")) {
                    nistTag = groupName.substring(groupName.lastIndexOf("_") + 1);
                    hdfTags.push(nistTag.charAt(0).toUpperCase() + nistTag.charAt(1).toUpperCase() + nistTag.slice(2))
                }
            }
        }
        if (hdfTags.length > 0) {
            return hdfTags;
        } else {
            return [];
        }

    }

    // Get the compliance status of an Azure resource
    private getStatus(state: string): ExecJSON.ControlResultStatus {
        if (state === 'compliant') {
            return ExecJSON.ControlResultStatus.Passed;
        } else if (state === 'noncompliant') {
            return ExecJSON.ControlResultStatus.Failed;
        } else {
            return ExecJSON.ControlResultStatus.Skipped;
        }
    }

    // Helper Function
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Helper Function
    // Testing writing to file
    private async writeHdf(hdf: ExecJSON.Execution) {
        var outputJson = JSON.stringify(hdf);
        fs.writeFile('azure-policy-test.json', outputJson, function (err: string) {
            if (err) {
                throw err;
            }
            console.log('complete');

        })
    }
}
const azurePolicyConverter = new AzurePolicyConverter();
