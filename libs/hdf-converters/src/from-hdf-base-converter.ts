import {MappedTransform, ILookupPath, MappedReform, ObjectEntries} from './base-converter';
import {ExecJSON} from 'inspecjs';
import { ExecJSONControl, ExecJSONProfile } from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import { StringLiteralLike } from 'typescript';
import _ from 'lodash';
import fs from 'fs';
import { createHash } from "crypto";




export class FromHDFBaseConverter {

    data: ExecJSON.Execution;
    mappings?: MappedTransform<ExecJSONASFF, (ILookupPath & {passParent?: boolean})>;
    collapseResults: boolean;
  
    constructor(data: ExecJSON.Execution, collapseResults = false) {
      this.data = data;
      this.collapseResults = collapseResults;
    }
  
    setMappings(
      mappings: MappedTransform<ExecJSONASFF, ILookupPath>
    ): void {
      this.mappings = mappings;
    }
  
    //Called over and over to iterate through objects assigned to keys too
  convertInternal<T>(
    file: object,
    fields: T
  ): MappedReform<T, ILookupPath> {
    const result = this.objectMap(fields, (v: ObjectEntries<T>) =>
      this.evaluate(file, v)
    );
    return result as MappedReform<T, ILookupPath>;
  }
  //Map is passed here to get looked through by each key pairs
  //Inner most to outward,
  //You take the key value pair in array form from each pair in the map, then  create an array of the key mapped to the result of value passed to evaluate
  // All the results should then be turned into one big object formed from the arrays of key value paids
  //file is the parsed data
  //fields is the mapping the data is being formed into    ;  objectMap updates all the fields in objectMap
  //iterates through the keys in field map, and based on matches in the lookup , assigns the data to the fields
  objectMap<T, V>(obj: T, fn: (v: ObjectEntries<T>) => V): {[K in keyof T]: V} {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v)])
    ) as Record<keyof T, V>;
  }

    //Used to get the data located at the paths  
  // eslint-disable-next-line @typescript-eslint/ban-types
  evaluate<T extends object>(
    file: object,
    v: Array<T> | T
  ): T | Array<T> | MappedReform<T, ILookupPath> {
    const transformer = _.get(v, 'transformer');
    if (Array.isArray(v)) {
      return this.handleArray(file, v);
    } else if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean' ||
      v === null
    ) {
      return v;
    } else if (_.has(v, 'path')) {
      if (typeof transformer === 'function') {

        if (_.has(v, 'passParent')) {
            return transformer( this.handlePath(file, _.get(v, 'path') as string), this);
        }else{

            return transformer(this.handlePath(file, _.get(v, 'path') as string));
        }


     
      }
      const pathVal = this.handlePath(file, _.get(v, 'path') as string);
      if (Array.isArray(pathVal)) {
        return pathVal as T[];
      }
      return pathVal as T;
    }
    if (typeof transformer === 'function') {
      return transformer(file);
    } else {
      return this.convertInternal(file, v);
    }
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  handleArray<T extends object>(
    file: object,
    v: Array<T & ILookupPath>
  ): Array<T> {//Looks throguh parsed data file using the mapping setup in V
    if (v.length === 0) {
      return [];
    }
    if (v[0].path === undefined) {
      const arrayTransformer = v[0].arrayTransformer;//does nothing since null
      v = v.map((element) => {
        return _.omit(element, ['arrayTransformer']) as T & ILookupPath;
      });//does nothing too
      let output: Array<T> = [];//Create empty array of generic to push evaluated values
      v.forEach((element) => {
        output.push(this.evaluate(file, element) as T);
      });
      if (arrayTransformer !== undefined) {
        output = arrayTransformer(output, this.data) as T[];
      }
      return output;
    } else {
      const path = v[0].path;
      const key = v[0].key;
      const arrayTransformer = v[0].arrayTransformer;
      const transformer = v[0].transformer;
      if (this.hasPath(file, path)) {
        const pathVal = this.handlePath(file, path);//Any matches in the path even if more than one,  will grab an array of results, the issues
        if (Array.isArray(pathVal)) {
          v = pathVal.map((element: Record<string, unknown>) => {
            return _.omit(this.convertInternal(element, v[0]), [
              'path',
              'transformer',
              'arrayTransformer',
              'key'
            ]) as T;
          });
          if (key !== undefined) {
            v = this.collapseDuplicates(v, key, this.collapseResults);
          }
          if (arrayTransformer !== undefined) {
            v = arrayTransformer(v, this.data) as T[];
          }
          return v;
        } else {
          if (transformer !== undefined) {
            return [transformer(this.handlePath(file, path)) as T];
          } else {
            return [this.handlePath(file, path) as T];
          }
        }
      } else {
        return [];
      }
    }
  }

  //Gets the value at the path using lodash and path stored in object
  handlePath(file: object, path: string): unknown {
    if (path.startsWith('$.')) {
      return _.get(this.data, path.slice(2)) || '';
    } else {
      return _.get(file, path) || '';
    }
  }
  hasPath(file: object, path: string): boolean {
    if (path.startsWith('$.')) {
      return _.has(this.data, path.slice(2));
    } else {
      return _.has(file, path);
    }
  }


 collapseDuplicates<T extends object>(
    array: Array<T>,
    key: string,
    collapseResults: boolean
  ): Array<T> {//Method is used to take the array of issues that will be formatted as controlls. Then group the duplicates into results for the correct control number
    const seen = new Map<string, number>();
    const newArray: T[] = [];
    let counter = 0;
    array.forEach((item: T) => {
      const propertyValue = _.get(item, key);
      if (typeof propertyValue === 'string') {
        const index = seen.get(propertyValue) || 0;
        if (!seen.has(propertyValue)) {//Sets the  control with first result
          newArray.push(item);
          seen.set(propertyValue, counter);
          counter++;
        } else {
          const oldResult = _.get(
            newArray[index],
            'results'
          ) as ExecJSON.ControlResult[];//Grab cureent list if results
          const descriptions = oldResult.map((element) =>
            _.get(element, 'code_desc')
          );//grab description
          if (collapseResults) {
            if (
              descriptions.indexOf(
                _.get(item, 'results[0].code_desc') as string
              ) === -1
            ) {//Handles appending the results to eachother if can't be found
              _.set(
                newArray[index],
                'results',
                oldResult.concat(
                  _.get(item, 'results') as ExecJSON.ControlResult[]
                )
              );
            }
          } else {//Handles appending the results to eachother inside a control
            _.set(
              newArray[index],
              'results',
              oldResult.concat(_.get(item, 'results') as ExecJSON.ControlResult[])
            );
          }
        }
      }
    });
    return newArray;
  }
  }

  

  export class ReverseASFFMapper extends FromHDFBaseConverter {
    mappings: MappedTransform<ExecJSONASFF, (ILookupPath & {passParent?: boolean})> = {
        Findings: [
               {
        
                    SchemaVersion: "2018-10-08",
                    Id:{path: `controls`, transformer: this.configureId, passParent: true}, 
                    ProductArn: "",//depends on aws specifics options - fill with default info for account and regions,  pass defaults into constructor
                    ProductName: "",
                    CompanyName: "",
                    Region: "",//depends on aws specifics options
                    GeneratorId: "",
                    AwsAccountId: "",
                    Types: [
                        "Software and Configuration Checks"
                    ],
                    FirstObservedAt: "",
                    LastObservedAt: {path: `controls.results.start_time`} ,
                    CreatedAt: {path: `controls.results.start_time`} ,
                    UpdatedAt: "",
                    Severity: {
                        Product:  {path: `controls.impact`, transformer: this.toReadableImpact} ,
                        Label: {path: `controls.impact`, transformer: this.toReadableImpactStr}  ,
                        Normalized: {path: `controls.impact`, transformer: this.toReadableImpact} ,
                        Original: {path: `controls.impact`, transformer: this.toReadableImpactStr}  
                    },
                    Title: {path: `controls.title`},
                    Description: {path:`controls.desc`},
                    Remediation: {
                        Recommendation: {
                            Text: `controls.descriptions.data`,//regex
                            Url: `controls.descriptions.data`//regex fo URL
                        }
                    },
                    ProductFields: {
                        StandardsGuideArn: "",
                        StandardsGuideSubscriptionArn: "",
                        RuleId: "",
                        RecommendationUrl: "",
                        StandardsControlArn: "",
                        'aws/securityhub/ProductName':"",
                        'aws/securityhub/CompanyName': "",
                        'aws/securityhub/annotation': "",
                        'Resources:0/Id': "",
                        'aws/securityhub/FindingId':""
                    },
                    Resources: [{
                        Type: "",
                        Id: "",
                        Partition: "",
                        Region: ""
                    }],
                    Compliance: {
                        Status: {path: `controls.results.status`, transformer: this.toUpperCaps},
                        StatusReasons: [{
                            ReasonCode:"",
                            Description: ""
                        }]
                    },
                    WorkflowState: "",
                    Workflow: {
                        Status: ""
                    },
                    RecordState: "",
                    FindingProviderFields: {
                        Severity: {
                            Label: "", 
                            Original: ""
                        },
                        Types: []
                    }
                }
            ]
        
        
        };


    controlDictionary: any;

    constructor(hdfObj: ExecJSON.Execution) {
      super(hdfObj);
      
      this.loadControlDictionary();
    }


    loadControlDictionary(){

        let awsCisStandard = JSON.parse(fs.readFileSync(
            'sample_jsons/asff_mapper/sample_input_report/aws_cis_standard.json',
            {encoding: 'utf-8'}
          ))
        
          //Turn into an easy lookup
          let aCSDict: Record<string, AWSCISStandard>= { };
          awsCisStandard["Controls"].forEach(( element: AWSCISStandard ) => {
            aCSDict[element.ControlId] = element;
          });

          this.controlDictionary = aCSDict;

    }
    setMappings(
      customMappings: MappedTransform<ExecJSONASFF, ILookupPath>
    ): void {
      super.setMappings(customMappings);
    }


    toAsff(): ExecJSONASFF|null {
        if (this.mappings === undefined) {
          throw new Error('Mappings must be provided');
        } else {
            //Flatten Results into Control and flatten in Profiles, so all main are a single iteration
            let flattenedProfiles: object[] = this.flattenProContRes();
            
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
    const profiles: ExecJSONProfile[] = this.data.profiles;
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
  


  //Transformer functions
    toReadableImpact(impact: unknown): number {

    if (typeof impact ===  'number') {
        
      
        return impact * 100;
    } else {
        //return '';
    
        return 0;
    }
    
  
  }
 toReadableImpactStr(impact: unknown): string {

    
    const IMPACT_ARRAY: Array<Array<number | string>>= [[0.9, "CRITICAL"],
    [0.7, "HIGH"],
    [0.5, "MEDIUM"],
    [0.3, "LOW"],
    [0.0, "INFORMATION"]]
    
    

      if (typeof impact ===  'number') {
        
      
            let impactStr: Array<Array<number | string>>  = IMPACT_ARRAY.filter(arr => impact >= arr[0]);
            if(impactStr.length > 0) return impactStr[0][1].toString();
            return "NA";
        } else {
            //return '';
        
            return "NA";
        }
  
  }

 toUpperCaps(val: unknown): string {

    if( typeof val === 'string'){
        return val.toString();
    }
    return "";
  }

configureId(val: unknown, newThis:unknown): string {
        //var newThis = this as ReverseASFFMapper;
        var newerThis = newThis as ReverseASFFMapper
        var newVal = val as {id: string, results: {code_desc: string}};

        var controlObj: AWSCISStandard = newerThis.controlDictionary["CIS."+newVal.id];
        if(controlObj == undefined){
            return ""
        }
        return `${controlObj.StandardsControlArn}/finding/${createHash("sha256").update(controlObj.ControlId + newVal.results.code_desc).digest("hex")}`
        
  }
}

/////Interfaces for ExecJSON focused on ASFF
  
export interface ExecJSONASFF {
    Findings:   FindingASFF[];
}

export interface FindingASFF {
    SchemaVersion:       string;
    Id:                  string;
    ProductArn:         string;
    ProductName:        string;
    CompanyName:        string;
    Region:             string;
    GeneratorId:        string;
    AwsAccountId:       string;
    Types:              string[];
    FirstObservedAt:     string;
    LastObservedAt:      string;
    CreatedAt:           string;
    UpdatedAt:           string;
    Severity:    SeverityASFF;
    Title:          string;
    Description:   string;
    Remediation:         RemediationASFF;
    ProductFields: ProductFieldsASFF;
    Resources:         ResourcesASFF[];
    Compliance: ComplianceASFF;
    WorkflowState:           string;
    Workflow:         {Status: string};
    RecordState: string;
    FindingProviderFields: FindingProviderFieldsASFF;
}

export interface SeverityASFF {
                Product: number;
                Label: string;
                Normalized: number,
                Original: string
}

export interface RemediationASFF {
    Recommendation: {Text: string; Url: string}
}

export interface ProductFieldsASFF{

    StandardsGuideArn: string;
    StandardsGuideSubscriptionArn: string;
    RuleId: string;
    RecommendationUrl: string;
    StandardsControlArn: string;
    'aws/securityhub/ProductName':string;
    'aws/securityhub/CompanyName':string;
    'aws/securityhub/annotation':string;
    'Resources:0/Id':string;
    'aws/securityhub/FindingId':string;


}

export interface ResourcesASFF {
    Type: string;
    Id: string;
    Partition: string;
    Region: string;
}

export interface ComplianceASFF {
    Status: string;
    StatusReasons: ({ReasonCode:string|null, Description:string|null } | null)[] ;
}
export interface FindingProviderFieldsASFF {
    Severity: {Label: string, Original: string};
    Types: string[]
}

export interface AWSCISStandard {
    "StandardsControlArn": string,
            "ControlStatus": string,
            "ControlStatusUpdatedAt": string,
            "ControlId": string,
            "Title": string,
            "Description": string,
            "RemediationUrl": string,
            "SeverityRating": string,
            "RelatedRequirements": string[]
}