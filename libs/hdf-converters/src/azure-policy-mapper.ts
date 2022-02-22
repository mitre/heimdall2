//  AZURE_TENANT_ID - The Azure Active Directory tenant (directory) ID.
//  AZURE_CLIENT_ID - The client (application) ID of an App Registration in the tenant.
//Environment variables used for client credential authentication:
//  AZURE_CLIENT_SECRET - A client secret that was generated for the App Registration.
//  AZURE_CLIENT_CERTIFICATE_PATH - The path to a PEM certificate to use during the authentication, instead of the client secret.
//Alternatively, users can provide environment variables for username and password authentication:
//  AZURE_USERNAME - Username to authenticate with.
//  AZURE_PASSWORD - Passord to authenticate with.
import { DefaultAzureCredential } from "@azure/identity";
import { PolicyInsightsClient } from "@azure/arm-policyinsights";
import { PolicyClient } from "@azure/arm-policy";
import { ExecJSON } from 'inspecjs';
import { AzurePolicyMapping } from './mappings/AzurePolicyMapping';
import { version as HeimdallToolsVersion } from '../package.json';
import { setLogLevel } from "@azure/logger"; // helps with troubleshooting
// For troubleshooting API calls, uncomment below
//setLogLevel("info");

var fs = require('fs');

// Load Azure Subscription ID as a variable from an OS environment variable.
const subscriptionId: string = process.env["AZURE_SUBSCRIPTION_ID"]!; // Might need to check this with input validation & error handling..
// Create credential object. Reference the environment variable notes above.
const credential = new DefaultAzureCredential();

const NAME = "Azure Policy"
const AZURE_POLICY_MAPPING = new AzurePolicyMapping();

// Interfaces
interface PolicyDefinition {
    id: string;
    subscriptionId: string;
    name?: string;
    detailedName?: string;
    description?: string;
    groupNames?: string[];
    state?: string;
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
        //console.log(credential)
        this.results = [];
        let policyDefinitions = this.generateHDF(credential, subscriptionId);
        console.log(policyDefinitions);

    }

    //generateHDF
    // This main function pulls in data from Azure Policy and Azure Policy Insights and generates
    // a Heimdall Data Format file.
    // To Do: Add Try Catch and Error Handling
    private async generateHDF(credential: DefaultAzureCredential, subscriptionId: string): Promise<PolicyDefinition[]> {
        const policyDefinitions: PolicyDefinition[] = [];
        const staticPolicyDefinitions: PolicyDefinition[] = [];
        // Array for holding Group Names (NIST mappings)
        let groupNames: string[] = [];
        // Flag for Policy Compliance State
        let complianceState: string = ""
        // Initalize Policy Insights Client
        const policyInsightsClient = new PolicyInsightsClient(credential, subscriptionId);
        // Initalize Policy Client
        const policyClient = new PolicyClient(credential, subscriptionId);
        var count: number = 0;
        for await (const policyState of policyInsightsClient.policyStates.listQueryResultsForSubscription('default', subscriptionId)) {
            // Reset Array for GroupNames
            groupNames = [];
            if (policyState.isCompliant !== undefined) {
                complianceState = policyState.isCompliant == false ? "noncompliant" : "compliant";
            } else {
                complianceState = "compliant" //??
            }
            if (policyState.policyDefinitionGroupNames !== undefined) {
                policyState.policyDefinitionGroupNames.forEach((groupName) => {
                    groupNames.push(groupName);
                });
            }
            if (policyState.policyDefinitionId !== undefined) {
                policyDefinitions.push({
                    id: policyState.policyDefinitionId,
                    subscriptionId: subscriptionId,
                    state: complianceState,
                    groupNames: this.parseGroupNames(groupNames || [])
                })
            }

        }

        // Loop through each Policy and retrieve the metadata (name, description, etc.) associated with that policy.
        for (let i = 0; i < policyDefinitions.length; i++) {
            await this.delay(150);
            let policyAssignmentList = await policyClient.policyAssignments.getById(policyDefinitions[i].id);
            policyDefinitions[i].detailedName = policyAssignmentList.displayName;
            policyDefinitions[i].name = policyAssignmentList.name;
            policyDefinitions[i].description = policyAssignmentList.description;
        }

        // Get Static Policies that Microsoft is responsible for meeting NIST 800-53 controls.
        // Async pull static policies from the Policy Insights API
        let staticPolicies = [];
        for await (const item of policyClient.policyDefinitions.list({ filter: "policyType eq 'Static'" })) {
            staticPolicies.push(item);
        }
        await this.delay(150);

        for (let i = 0; i < staticPolicies.length; i++) {
            // Get Policy Details
            let policyAssignmentList = await policyClient.policyAssignments.getById(staticPolicies[i].id!);
            // Get Policy Control Mapping
            groupNames = AZURE_POLICY_MAPPING.nistFilter([policyAssignmentList.displayName!])!;
            if (groupNames === null || groupNames === undefined) {
                groupNames = ["unmapped"]
            }

            policyDefinitions.push({
                id: staticPolicies[i].id!,
                subscriptionId: subscriptionId,
                detailedName: policyAssignmentList.displayName,
                name: policyAssignmentList.name,
                description: policyAssignmentList.description,
                groupNames: groupNames,
                state: "compliant",
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
            //console.log(profile.controls);
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
                results: [
                    {
                        "code_desc": "",
                        "run_time": 0,
                        "skip_message": "0.00",
                        "start_time": "0.00",
                        "status": this.getStatus(policyDefinition)
                    }
                ]//this.results[index]
            };
            index++;
            return control

        });
    }

    // Currently only parsing NIST groupNames
    // Add notes to explain parsing
    private parseGroupNames(groupNames: string[]) {
        let hdfTags: string[] = []
        let nistTag: string = ""
        //console.log(groupNames)
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
            return ["unmapped"];
        }

    };

    private getStatus(policyDefinition: PolicyDefinition): ExecJSON.ControlResultStatus {
        if (policyDefinition.state === 'compliant') {
            return ExecJSON.ControlResultStatus.Passed;
        } else if (policyDefinition.state === 'noncompliant') {
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