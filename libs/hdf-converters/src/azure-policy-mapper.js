"use strict";
//  AZURE_TENANT_ID - The Azure Active Directory tenant (directory) ID.
//  AZURE_CLIENT_ID - The client (application) ID of an App Registration in the tenant.
//Environment variables used for client credential authentication:
//  AZURE_CLIENT_SECRET - A client secret that was generated for the App Registration.
//  AZURE_CLIENT_CERTIFICATE_PATH - The path to a PEM certificate to use during the authentication, instead of the client secret.
//Alternatively, users can provide environment variables for username and password authentication:
//  AZURE_USERNAME - Username to authenticate with.
//  AZURE_PASSWORD - Passord to authenticate with.
// This converter was written for: https://docs.microsoft.com/en-us/azure/governance/policy/samples/nist-sp-800-53-r4
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var identity_1 = require("@azure/identity");
var arm_policyinsights_1 = require("@azure/arm-policyinsights");
var arm_policy_1 = require("@azure/arm-policy");
var inspecjs_1 = require("inspecjs");
var AzurePolicyMapping_1 = require("./mappings/AzurePolicyMapping");
var package_json_1 = require("../package.json");
// For troubleshooting API calls, uncomment below
//import { setLogLevel } from "@azure/logger"; // helps with troubleshooting
//setLogLevel("info");
var fs = require('fs');
// Load Azure Subscription ID as a variable from an OS environment variable.
var subscriptionId = "";
if (process.env["AZURE_SUBSCRIPTION_ID"] === undefined) {
    console.log("Error: Environment variable \"AZURE_SUBSCRIPTION_ID\" is undefined. Set this variable with the Azure Subscription Id.");
    process.exit(1);
}
else {
    subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];
}
// Create credential object. Reference the environment variable notes above.
var credential = new identity_1.DefaultAzureCredential();
// Set HDF name and initialize AzurePolicyMapping object.
var NAME = "Azure Policy";
var AZURE_POLICY_MAPPING = new AzurePolicyMapping_1.AzurePolicyMapping();
//Azure Policy Converter Class
var AzurePolicyConverter = /** @class */ (function () {
    //Class Constructor
    // credential - Azure Credentials object to authenticate with.
    // subscriptionId - Subscription ID to query against.
    function AzurePolicyConverter(credential, subscriptionId) {
        console.log("Generating HDF");
        this.results = [];
        this.toHDF(credential, subscriptionId);
    }
    //generateHDF
    // This main function pulls in data from Azure Policy and Azure Policy Insights and generates
    // a Heimdall Data Format file.
    // To Do: Add Try Catch and Error Handling
    AzurePolicyConverter.prototype.toHDF = function (credential, subscriptionId) {
        var e_1, _a, e_2, _b;
        var _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var policyDefinitions, staticPolicyDefinitions, groupNames, complianceState, policyInsightsClient, policyClient, _e, _f, policyState, azureResource, policyDefinitionIndex, resourceIndex, e_1_1, i, policyAssignmentList, staticPolicies, _g, _h, item, e_2_1, i, policyAssignmentList, azureResource, hdf, outputJson;
            var _j, _k;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        policyDefinitions = [];
                        staticPolicyDefinitions = [];
                        groupNames = [];
                        complianceState = "";
                        policyInsightsClient = new arm_policyinsights_1.PolicyInsightsClient(credential, subscriptionId);
                        policyClient = new arm_policy_1.PolicyClient(credential, subscriptionId);
                        _l.label = 1;
                    case 1:
                        _l.trys.push([1, 6, 7, 12]);
                        _e = __asyncValues(policyInsightsClient.policyStates.listQueryResultsForSubscription('default', subscriptionId));
                        _l.label = 2;
                    case 2: return [4 /*yield*/, _e.next()];
                    case 3:
                        if (!(_f = _l.sent(), !_f.done)) return [3 /*break*/, 5];
                        policyState = _f.value;
                        // Reset Array for GroupNames
                        groupNames = [];
                        if (policyState.isCompliant !== undefined) {
                            complianceState = policyState.isCompliant === false ? "noncompliant" : "compliant";
                        }
                        else {
                            complianceState = "compliant";
                        }
                        // Loop through NIST 800-53 control mappings and add to groupNames list
                        if (policyState.policyDefinitionGroupNames !== undefined) {
                            policyState.policyDefinitionGroupNames.forEach(function (groupName) {
                                groupNames.push(groupName);
                            });
                        }
                        azureResource = {
                            id: policyState.resourceId,
                            subscriptionId: subscriptionId,
                            type: policyState.resourceType,
                            state: complianceState,
                            location: policyState.resourceLocation
                        };
                        // If policyDefinitions array doesn't contain current policyDefinition then add it
                        if (policyDefinitions.findIndex(function (PolicyDefinition) { return PolicyDefinition.id === policyState.policyDefinitionId; }) === -1) {
                            if (policyState.policyDefinitionId !== undefined) {
                                policyDefinitions.push({
                                    id: policyState.policyDefinitionId,
                                    subscriptionId: subscriptionId,
                                    state: complianceState,
                                    groupNames: this.parseGroupNames(groupNames || []),
                                    resources: [azureResource]
                                });
                            }
                        }
                        else {
                            policyDefinitionIndex = policyDefinitions.findIndex(function (PolicyDefinition) { return PolicyDefinition.id === policyState.policyDefinitionId; });
                            resourceIndex = (_c = policyDefinitions[policyDefinitionIndex].resources) === null || _c === void 0 ? void 0 : _c.findIndex(function (AzureResource) { return AzureResource.id === azureResource.id; });
                            if (resourceIndex === -1) {
                                (_d = policyDefinitions[policyDefinitionIndex].resources) === null || _d === void 0 ? void 0 : _d.push(azureResource);
                            }
                        }
                        _l.label = 4;
                    case 4: return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 12];
                    case 6:
                        e_1_1 = _l.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 12];
                    case 7:
                        _l.trys.push([7, , 10, 11]);
                        if (!(_f && !_f.done && (_a = _e["return"]))) return [3 /*break*/, 9];
                        return [4 /*yield*/, _a.call(_e)];
                    case 8:
                        _l.sent();
                        _l.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 11: return [7 /*endfinally*/];
                    case 12:
                        i = 0;
                        _l.label = 13;
                    case 13:
                        if (!(i < policyDefinitions.length)) return [3 /*break*/, 17];
                        return [4 /*yield*/, this.delay(150)];
                    case 14:
                        _l.sent();
                        return [4 /*yield*/, policyClient.policyAssignments.getById(policyDefinitions[i].id)];
                    case 15:
                        policyAssignmentList = _l.sent();
                        policyDefinitions[i].detailedName = policyAssignmentList.displayName;
                        policyDefinitions[i].name = policyAssignmentList.name;
                        policyDefinitions[i].description = policyAssignmentList.description;
                        _l.label = 16;
                    case 16:
                        i++;
                        return [3 /*break*/, 13];
                    case 17:
                        staticPolicies = [];
                        _l.label = 18;
                    case 18:
                        _l.trys.push([18, 23, 24, 29]);
                        _g = __asyncValues(policyClient.policyDefinitions.list({ filter: "policyType eq 'Static'" }));
                        _l.label = 19;
                    case 19: return [4 /*yield*/, _g.next()];
                    case 20:
                        if (!(_h = _l.sent(), !_h.done)) return [3 /*break*/, 22];
                        item = _h.value;
                        staticPolicies.push(item);
                        _l.label = 21;
                    case 21: return [3 /*break*/, 19];
                    case 22: return [3 /*break*/, 29];
                    case 23:
                        e_2_1 = _l.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 29];
                    case 24:
                        _l.trys.push([24, , 27, 28]);
                        if (!(_h && !_h.done && (_b = _g["return"]))) return [3 /*break*/, 26];
                        return [4 /*yield*/, _b.call(_g)];
                    case 25:
                        _l.sent();
                        _l.label = 26;
                    case 26: return [3 /*break*/, 28];
                    case 27:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 28: return [7 /*endfinally*/];
                    case 29: return [4 /*yield*/, this.delay(150)];
                    case 30:
                        _l.sent();
                        i = 0;
                        _l.label = 31;
                    case 31:
                        if (!(i < staticPolicies.length)) return [3 /*break*/, 34];
                        return [4 /*yield*/, policyClient.policyAssignments.getById(staticPolicies[i].id)];
                    case 32:
                        policyAssignmentList = _l.sent();
                        // Get Policy Control Mapping
                        groupNames = AZURE_POLICY_MAPPING.nistFilter([policyAssignmentList.displayName]);
                        if (groupNames === null || groupNames === undefined) {
                            groupNames = [];
                        }
                        azureResource = {
                            id: "Microsoft Managed",
                            subscriptionId: subscriptionId,
                            type: "N/A",
                            state: "compliant",
                            location: "N/A"
                        };
                        policyDefinitions.push({
                            id: staticPolicies[i].id || "Not Available",
                            subscriptionId: subscriptionId,
                            detailedName: policyAssignmentList.displayName,
                            name: policyAssignmentList.name,
                            description: policyAssignmentList.description,
                            groupNames: groupNames,
                            state: "compliant",
                            resources: [azureResource]
                        });
                        _l.label = 33;
                    case 33:
                        i++;
                        return [3 /*break*/, 31];
                    case 34:
                        _j = {
                            platform: {
                                name: 'Heimdall Tools',
                                release: package_json_1.version,
                                target_id: ''
                            },
                            version: package_json_1.version,
                            statistics: {
                                //azure_policy_sdk_version: 1, // How do i get the sdk version?
                                duration: null
                            }
                        };
                        _k = {
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
                            status: 'loaded'
                        };
                        return [4 /*yield*/, this.getControls(policyDefinitions)];
                    case 35:
                        hdf = (_j.profiles = [
                            (_k.controls = _l.sent(),
                                _k.sha256 = '',
                                _k)
                        ],
                            _j);
                        hdf.profiles.forEach(function (profile) {
                        });
                        outputJson = JSON.stringify(hdf);
                        fs.writeFile('azure-policy-test.json', outputJson, function (err) {
                            if (err)
                                throw err;
                            console.log('complete');
                        });
                        return [2 /*return*/, policyDefinitions];
                }
            });
        });
    };
    ;
    AzurePolicyConverter.prototype.getControls = function (policyDefinitions) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        index = 0;
                        return [4 /*yield*/, policyDefinitions];
                    case 1: return [2 /*return*/, (_a.sent()).map(function (policyDefinition) {
                            var control = {
                                id: policyDefinition.name || '',
                                title: policyDefinition.detailedName || '',
                                desc: policyDefinition.description || null,
                                impact: 0.5,
                                tags: { nist: policyDefinition.groupNames },
                                descriptions: [],
                                refs: [],
                                source_location: { ref: policyDefinition.subscriptionId, line: 1 },
                                code: '',
                                results: _this.getTestResults(policyDefinition)
                            };
                            index++;
                            return control;
                        })];
                }
            });
        });
    };
    // Build Results
    AzurePolicyConverter.prototype.getTestResults = function (policyDefinition) {
        var results = [];
        if (policyDefinition.resources !== undefined) {
            for (var i = 0; i < policyDefinition.resources.length; i++) {
                var hdfResult = {
                    code_desc: "Resource: " + policyDefinition.resources[i].id
                        + "\nType: " + policyDefinition.resources[i].type
                        + "\nLocation: " + policyDefinition.resources[i].location
                        + "\nSubscription: " + policyDefinition.resources[i].subscriptionId,
                    resource: policyDefinition.resources[i].id,
                    start_time: '',
                    run_time: 0.00,
                    status: this.getStatus(policyDefinition.resources[i].state)
                };
                results.push(hdfResult);
            }
        }
        return results;
    };
    // Currently only parsing NIST groupNames
    // Add notes to explain parsing
    AzurePolicyConverter.prototype.parseGroupNames = function (groupNames) {
        var hdfTags = [];
        var nistTag = "";
        if (groupNames !== undefined) {
            for (var i = 0; i < groupNames.length; i++) {
                if (groupNames[i].includes("nist")) {
                    nistTag = groupNames[i].substring(groupNames[i].lastIndexOf("_") + 1);
                    hdfTags.push(nistTag.charAt(0).toUpperCase() + nistTag.charAt(1).toUpperCase() + nistTag.slice(2));
                }
                ;
            }
            ;
        }
        ;
        if (hdfTags.length > 0) {
            return hdfTags;
        }
        else {
            return [];
        }
    };
    ;
    AzurePolicyConverter.prototype.getStatus = function (state) {
        if (state === 'compliant') {
            return inspecjs_1.ExecJSON.ControlResultStatus.Passed;
        }
        else if (state === 'noncompliant') {
            return inspecjs_1.ExecJSON.ControlResultStatus.Failed;
        }
        else {
            return inspecjs_1.ExecJSON.ControlResultStatus.Skipped;
        }
    };
    AzurePolicyConverter.prototype.delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    return AzurePolicyConverter;
}());
;
var azurePolicyConverter = new AzurePolicyConverter(credential, subscriptionId);
