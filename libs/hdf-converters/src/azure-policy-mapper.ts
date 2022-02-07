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
var fs = require('fs');
//import { version as HeimdallToolsVersion } from '../package.json'; //This isn't working properly..
//Load Azure Subscription ID as a variable from an OS environment variable.
const subscriptionId: string = process.env["AZURE_SUBSCRIPTION_ID"]!; // Might need to check this with input validation & error handling..
//Create credential object. Reference the environment variable notes above.
const credential = new DefaultAzureCredential();

const NAME = "Azure Policy"

//Interfaces
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
    //policyDefinitions: PolicyDefinition[] = [];
    results: ExecJSON.ControlResult[][];
    //Class Constructor
    // credential - Azure Credentials object to authenticate with.
    // subscriptionId - Subscription ID to query against.
    constructor(credential: DefaultAzureCredential, subscriptionId: string) {
        console.log("Generating HDF")
        console.log(credential)
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
        // Array for holding Group Names (NIST mappings)
        let groupNames: string[] = [];
        // Flag for Policy Compliance State
        let complianceState: string = ""
        // Initalize Policy Insights Client
        const policyInsightsClient = new PolicyInsightsClient(credential, subscriptionId);
        // Initalize Policy Client
        const policyClient = new PolicyClient(credential, subscriptionId);
        // Async pull Policy States Summary from the Policy Insights API
        let policyStatesSummary = await policyInsightsClient.policyStates.summarizeForSubscription(subscriptionId);
        // NOTE: This might not be needed..
        await this.delay(150);
        console.log(policyStatesSummary.value)
        if (policyStatesSummary === undefined) {
            throw new Error('No data was returned');
        } else {
            // There has to be a cleaner way of doing this!
            if (policyStatesSummary.value !== undefined) {
                policyStatesSummary.value.forEach((summary) => {
                    console.log("Summary: " + summary.policyAssignments)
                    if (summary.policyAssignments !== undefined) {
                        console.log("log 2")
                        summary.policyAssignments.forEach((policyAssignment) => {
                            if (policyAssignment.policyDefinitions !== undefined) {
                                console.log("log 3")
                                policyAssignment.policyDefinitions.forEach((policyDefinition) => {
                                    console.log("ID: " + policyDefinition.policyDefinitionId)

                                    // Reset Array for GroupNames
                                    groupNames = [];
                                    console.log(policyDefinition.results);
                                    if (policyDefinition.results?.nonCompliantResources !== undefined) {
                                        complianceState = policyDefinition.results.nonCompliantResources > 0 ? "noncompliant" : "compliant";
                                    } else {
                                        complianceState = "compliant" //??
                                    }
                                    if (policyDefinition.policyDefinitionGroupNames !== undefined) {
                                        policyDefinition.policyDefinitionGroupNames.forEach((groupName) => {
                                            //console.log(" - " + groupName);
                                            groupNames.push(groupName);
                                        });
                                    }
                                    if (policyDefinition.policyDefinitionId !== undefined) {
                                        policyDefinitions.push({
                                            id: policyDefinition.policyDefinitionId,
                                            subscriptionId: subscriptionId,
                                            state: complianceState,
                                            groupNames: groupNames
                                        })
                                    }

                                });
                            }
                        });
                    }
                });
            }
        }
        // Loop through each Policy and retrieve the metadata (name, description, etc.) associated with that policy.
        for (let i = 0; i < policyDefinitions.length; i++) {
            //console.log(" === Index: " + i + " === ")
            //console.log(policyDefinitions[i]);
            // NOTE: This might not be needed..
            await this.delay(150);
            let policyAssignmentList = await policyClient.policyAssignments.getById(policyDefinitions[i].id);
            policyDefinitions[i].detailedName = policyAssignmentList.displayName;
            policyDefinitions[i].name = policyAssignmentList.name;
            policyDefinitions[i].description = policyAssignmentList.description;
        }

        //console.log(policyDefinitions)


        // Fix until package.json is working.
        const HeimdallToolsVersion: string = "1";
        const hdf: ExecJSON.Execution = {
            platform: {
                name: 'Heimdall Tools',
                release: HeimdallToolsVersion,
                target_id: ''
            },
            version: HeimdallToolsVersion,
            statistics: {
                //aws_config_sdk_version: ConfigService., // How do i get the sdk version?
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
                tags: this.parseGroupNames(policyDefinition.groupNames || []),
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
        console.log(groupNames)
        if (groupNames !== undefined) {
            for (let i = 0; i < groupNames.length; i++) {
                if (groupNames[i].includes("nist")) {
                    nistTag = groupNames[i].substring(groupNames[i].lastIndexOf("_") + 1);
                    hdfTags.push(nistTag.charAt(0).toUpperCase() + nistTag.charAt(1).toUpperCase() + nistTag.slice(2))
                };
            };
        };
        if (hdfTags.length > 0) {
            return { "nist": hdfTags };
        } else {
            return { "nist": ["unmapped"] };
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