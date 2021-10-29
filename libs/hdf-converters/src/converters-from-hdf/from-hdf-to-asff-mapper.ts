import { FromHdfBaseConverter, ILookupPathFH, iOptions } from "./from-hdf-base-converter";
import {MappedTransform, MappedReform, ObjectEntries} from '../base-converter';
import { AWSCISStandard, ExecJSONASFF } from "./asff-types";
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
                    Types: ["Software and Configuration Checks"],
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
                      RelatedRequirements: ["SEE REMEDIATION FIELD FOR RESULTS AND RECOMMENDED ACTION(S)"],
                      Status: {path: "", transformer: setupControlStatus},
                    },
                  }
            ]
        
        
        };


    contextProfiles: any;
    counts: any;

    impactMapping: Map<number, string> = new Map([
        [0.9, "CRITICAL"],
        [0.7, "HIGH"],
        [0.5, "MEDIUM"],
        [0.3, "LOW"],
        [0.0, "INFORMATIONAL"],
      ]);
      target:any;
      findings: AwsSecurityFinding[];

    constructor(hdfObj: ExecJSON.Execution, options: iOptions|undefined ) {
      super(hdfObj, options);
       this.contextProfiles = contextualizeEvaluation(hdfObj);
       this.counts = statusCount(this.contextProfiles);
        this.target = this.ioptions.target.toLowerCase().trim();
        this.findings = []
      //this.loadControlDictionary();
      //this.performLogic();
    }

     sleep(milliseconds: number) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
          if (new Date().getTime() - start > milliseconds) {
            break;
          }
        }
      }

    loadControlDictionary(){

        /*let awsCisStandard = JSON.parse(fs.readFileSync(
            'sample_jsons/asff_mapper/sample_input_report/aws_cis_standard.json',
            {encoding: 'utf-8'}
          ))
        
          //Turn into an easy lookup
          let aCSDict: Record<string, AWSCISStandard>= { };
          awsCisStandard["Controls"].forEach(( element: AWSCISStandard ) => {
            aCSDict[element.ControlId] = element;
          });

          this.controlDictionary = aCSDict;*/

    }
    setMappings(
      customMappings: MappedTransform<ExecJSONASFF, ILookupPathFH>
    ): void {
      super.setMappings(customMappings);
    }

    flattenProContResV2(){//The control and result will be merged into profile object, so there will be one object for each finding

        let flattenedProfiles: object[] = [];

        this.data.profiles.forEach((profile) => {
            profile.controls.reverse().forEach((control) => {
              const layersOfControl = getAllLayers(this.data, control);
              control.results.forEach((segment) => {
                // Ensure that the UpdatedAt time is different accross findings (to match the order in HDF)
                this.sleep(1);
                //let controlObj = Object.assign({}, control, {"results": segment}, {"layerOfControl":layersOfControl})
                    //let profFlat = Object.assign({},profile, {"controls": controlObj});
                    let profFlat = Object.assign({},profile,{"controls":control},{"results": undefined}, {"results": segment}, {"layersOfControl":layersOfControl});
                    
                    flattenedProfiles.push(profFlat);

              });
            });
          });

        
        return flattenedProfiles;
      }


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

  flattenProContRes(){//The control and result will be merged into profile object, so there will be one object for each finding
    let flattenedProfiles: object[] = [];
    const profiles: ExecJSON.Profile[] = this.data.profiles;
    profiles.forEach((profile)=>{
        profile.controls.forEach((control)=>{
            control.results.forEach((result)=>{
                let controlObj = Object.assign({}, control, {"results": result})
                let profFlat = Object.assign({},profile, {"controls": controlObj});
                flattenedProfiles.push(profFlat);

            });
        });
    });
    return flattenedProfiles;
  }

  finalizeASFFSchema(findingList: any[]){

    return {Findings: findingList}
  }
  


 

configureId(val: unknown, newThis:unknown): string {
        //var newThis = this as ReverseASFFMapper;
        /*var newerThis = newThis as ReverseASFFMapper
        var newVal = val as {id: string, results: {code_desc: string}};

        var controlObj: AWSCISStandard = newerThis.controlDictionary["CIS."+newVal.id];
        if(controlObj == undefined){
            return ""
        }
        return `${controlObj.StandardsControlArn}/finding/${createHash("sha256").update(controlObj.ControlId + newVal.results.code_desc).digest("hex")}`*/
        return "";
        
  }
}
