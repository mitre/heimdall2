import { FromHdfBaseConverter, ILookupPathFH } from "./from-hdf-base-converter";
import {MappedTransform, MappedReform, ObjectEntries} from '../base-converter';
import { AWSCISStandard, ExecJSONASFF, iOptions } from "./asff-types";
import {ExecJSON} from 'inspecjs';
import { convertFile, contextualizeEvaluation } from "inspecjs";
import { cleanText, createAssumeRolePolicyDocument, createCode, createNote, getAllLayers, setupAwsAcct, setupControlStatus, setupCreated, setupDescr, setupDetailsAssume, setupFindingType, setupGeneratorId, setupId, setupProdFieldCheck, setupProductARN, setupRegion, setupRemRec, setupResourcesID, setupResourcesID2, setupSevLabel, setupSevOriginal, setupTitle, setupUpdated, statusCount } from "./transformers";
import _ from "lodash";
import { createHash } from "crypto";
import {
    SecurityHubClient,
    BatchImportFindingsCommand,
    AwsSecurityFinding,
  } from "@aws-sdk/client-securityhub";
  
export class FromHdfToAsffMapper extends FromHdfBaseConverter {
    mappings: MappedTransform<ExecJSONASFF, (ILookupPathFH & {passParent?: boolean})> = {
        Findings: [
                {
                    SchemaVersion: "2018-10-08",
                    Id: {path: ``, transformer: setupId, passParent: true},
                    ProductArn: {path: ``, transformer: setupProductARN,passParent: true },
                    AwsAccountId: {path: ``, transformer: setupAwsAcct,passParent: true },
                    Types: {path:"IgnoreMyArray", transformer: ()=> ["Software and Configuration Checks"]},
                    CreatedAt: {path: `results`, transformer: setupCreated},
                    Region: {path: '', transformer: setupRegion, passParent: true},
                    UpdatedAt: {path: ``,transformer:setupUpdated},
                    GeneratorId: {path: "", transformer:setupGeneratorId, passParent: true},
                    Title: {path: "", transformer: setupTitle},
                    Description: {path: "", transformer: setupDescr},
                    FindingProviderFields: {
                      Severity: {
                        Label: { path: "", transformer: setupSevLabel, passParent: true}, 
                        Original:{ path: "", transformer: setupSevLabel, passParent: true} 
                      },
                      Types: { path: "", transformer: setupFindingType, passParent: true},
                    },
                    Remediation: {
                      Recommendation: {
                        Text: {path: "", transformer: setupRemRec}
                      },
                    },
                    ProductFields: {
                      Check: {path:"", transformer: setupProdFieldCheck},
                    },
                    Severity: {
                      Label: { path: "", transformer: setupSevLabel, passParent: true},
                      Original: { path: "", transformer: setupSevOriginal},
                    },
                    Resources: [
                      {
                        Type: "AwsAccount",
                        Id: {path:"", transformer:setupResourcesID,  passParent: true},
                        Partition: "aws",
                        Region: {path: '', transformer: setupRegion, passParent: true},
                      },
                      {
                        Id: {path: "", transformer: setupResourcesID2},
                        Type: "AwsIamRole",
                        Details: {
                          AwsIamRole: {
                            AssumeRolePolicyDocument: {path: "", transformer: setupDetailsAssume}
                          },
                        },
                      },
                    ],
                    Compliance: {
                      RelatedRequirements: {path:"IgnoreMyArray", transformer: ()=> ["SEE REMEDIATION FIELD FOR RESULTS AND RECOMMENDED ACTION(S)"]},
                      Status: {path: "", transformer: setupControlStatus},
                    },
                  }
            ]
        
        
        };


    contextProfiles: any;
    counts: any;
    ioptions: iOptions;

    impactMapping: Map<number, string> = new Map([
        [0.9, "CRITICAL"],
        [0.7, "HIGH"],
        [0.5, "MEDIUM"],
        [0.3, "LOW"],
        [0.0, "INFORMATIONAL"],
      ]);
      

    constructor(hdfObj: ExecJSON.Execution, options: iOptions|undefined ) {
      
      super(hdfObj);
      this.ioptions = (options === undefined)? this.defaultOptions(): options
       this.contextProfiles = contextualizeEvaluation(hdfObj);
       this.counts = statusCount(this.contextProfiles);
    }

    defaultOptions(): iOptions {

      return {

        input: "",
        output: "",
        awsAccountId: "",
        accessKeyId: "",
        accessKeySecret: "",
        target: "default",
        region: "",
        upload: false
      };
    }

     sleep(milliseconds: number) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
          if (new Date().getTime() - start > milliseconds) {
            break;
          }
        }
      }

    
    setMappings(
      customMappings: MappedTransform<ExecJSONASFF, ILookupPathFH>
    ): void {
      super.setMappings(customMappings);
    }

    flattenProContResV2(){//The control and result will be merged into profile object, so there will be one object for each finding to be formed from

        let flattenedProfiles: object[] = [];
        this.data.profiles.forEach((profile) => {
            profile.controls.reverse().forEach((control) => {
              const layersOfControl = getAllLayers(this.data, control);
              control.results.forEach((segment) => {
                // Ensure that the UpdatedAt time is different accross findings (to match the order in HDF)
                this.sleep(1);
                    let profFlat = Object.assign({},profile,{"controls":control},{"results": undefined}, {"results": segment}, {"layersOfControl":layersOfControl});
                    
                    flattenedProfiles.push(profFlat);//Array of all the merged profile,control, result in a 1 to 1 way

              });
            });
          });

        return flattenedProfiles;
      }


    //Convert from HDF to ASFF 
    toAsff(): ExecJSONASFF|null {
        if (this.mappings === undefined) {
          throw new Error('Mappings must be provided');
        } else {
            //Flatten Results into Control and flatten in Profiles, so all main are a single iteration
            let flattenedProfiles: object[] = this.flattenProContResV2();//this.flattenProContRes();
            
            //Recursively transform the data into ASFF format
            //Returns an array of the findings
            let resList: any[] = flattenedProfiles.map((fProfile)=>{
                return this.convertInternal(fProfile , this.mappings)["Findings"][0];
            });
            
            //Form the ASFF format of Findings mapped to the array of findings
            let finalASFF = this.finalizeASFFSchema(resList);
            console.log("Here");

        return finalASFF;
      }
  }


  finalizeASFFSchema(findingList: any[]){
    //Finish the formatting of ASFF, assign array of finding to Findings
    return {Findings: findingList}
  }
  
}
