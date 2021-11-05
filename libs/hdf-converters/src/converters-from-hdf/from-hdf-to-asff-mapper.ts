import {contextualizeEvaluation, ExecJSON} from 'inspecjs';
import {MappedTransform} from '../base-converter';
import {IExecJSONASFF, IOptions} from './asff-types';
import {FromHdfBaseConverter, ILookupPathFH} from './from-hdf-base-converter';
import {
  getAllLayers,
  setupAwsAcct,
  setupControlStatus,
  setupCreated,
  setupDescr,
  setupDetailsAssume,
  setupFindingType,
  setupGeneratorId,
  setupId,
  setupProdFieldCheck,
  setupProductARN,
  setupRegion,
  setupRemRec,
  setupResourcesID,
  setupResourcesID2,
  setupSevLabel,
  setupSevOriginal,
  setupTitle,
  setupUpdated,
  statusCount
} from './transformers';

export class FromHdfToAsffMapper extends FromHdfBaseConverter {
  mappings: MappedTransform<
    IExecJSONASFF,
    ILookupPathFH & {passParent?: boolean}
  > = {
    Findings: [
      {
        SchemaVersion: '2018-10-08',
        Id: {path: ``, transformer: setupId, passParent: true},
        ProductArn: {path: ``, transformer: setupProductARN, passParent: true},
        AwsAccountId: {path: ``, transformer: setupAwsAcct, passParent: true},
        Types: {
          path: 'IgnoreMyArray',
          transformer: () => ['Software and Configuration Checks']
        },
        CreatedAt: {path: `results`, transformer: setupCreated},
        Region: {path: '', transformer: setupRegion, passParent: true},
        UpdatedAt: {path: ``, transformer: setupUpdated},
        GeneratorId: {
          path: '',
          transformer: setupGeneratorId,
          passParent: true
        },
        Title: {path: '', transformer: setupTitle},
        Description: {path: '', transformer: setupDescr},
        FindingProviderFields: {
          Severity: {
            Label: {path: '', transformer: setupSevLabel, passParent: true},
            Original: {path: '', transformer: setupSevLabel, passParent: true}
          },
          Types: {path: '', transformer: setupFindingType, passParent: true}
        },
        Remediation: {
          Recommendation: {
            Text: {path: '', transformer: setupRemRec}
          }
        },
        ProductFields: {
          Check: {path: '', transformer: setupProdFieldCheck}
        },
        Severity: {
          Label: {path: '', transformer: setupSevLabel, passParent: true},
          Original: {path: '', transformer: setupSevOriginal}
        },
        Resources: [
          {
            Type: 'AwsAccount',
            Id: {path: '', transformer: setupResourcesID, passParent: true},
            Partition: 'aws',
            Region: {path: '', transformer: setupRegion, passParent: true}
          },
          {
            Id: {path: '', transformer: setupResourcesID2},
            Type: 'AwsIamRole',
            Details: {
              AwsIamRole: {
                AssumeRolePolicyDocument: {
                  path: '',
                  transformer: setupDetailsAssume
                }
              }
            }
          }
        ],
        Compliance: {
          RelatedRequirements: {
            path: 'IgnoreMyArray',
            transformer: () => [
              'SEE REMEDIATION FIELD FOR RESULTS AND RECOMMENDED ACTION(S)'
            ]
          },
          Status: {path: '', transformer: setupControlStatus}
        }
      }
    ]
  };

  contextProfiles: any;
  counts: any;
  ioptions: IOptions;

  impactMapping: Map<number, string> = new Map([
    [0.9, 'CRITICAL'],
    [0.7, 'HIGH'],
    [0.5, 'MEDIUM'],
    [0.3, 'LOW'],
    [0.0, 'INFORMATIONAL']
  ]);

  constructor(hdfObj: ExecJSON.Execution, options: IOptions | undefined) {
    super(hdfObj);
    this.ioptions = options === undefined ? this.defaultOptions() : options;
    this.contextProfiles = contextualizeEvaluation(hdfObj);
    this.counts = statusCount(this.contextProfiles);
  }

  defaultOptions(): IOptions {
    return {
      input: '',
      output: '',
      awsAccountId: '',
      accessKeyId: '',
      accessKeySecret: '',
      target: 'default',
      region: '',
      upload: false
    };
  }

  sleep(milliseconds: number) {
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
      if (new Date().getTime() - start > milliseconds) {
        break;
      }
    }
  }

  setMappings(
    customMappings: MappedTransform<IExecJSONASFF, ILookupPathFH>
  ): void {
    super.setMappings(customMappings);
  }

  flattenProContResV2() {
    //The control and result will be merged into profile object, so there will be one object for each finding to be formed from

    const flattenedProfiles: object[] = [];
    this.data.profiles.forEach((profile) => {
      profile.controls.reverse().forEach((control) => {
        const layersOfControl = getAllLayers(this.data, control);
        control.results.forEach((segment) => {
          // Ensure that the UpdatedAt time is different accross findings (to match the order in HDF)
          this.sleep(1);
          const profFlat = Object.assign(
            {},
            profile,
            {controls: control},
            {results: undefined},
            {results: segment},
            {layersOfControl: layersOfControl}
          );

          flattenedProfiles.push(profFlat); //Array of all the merged profile,control, result in a 1 to 1 way
        });
      });
    });

    return flattenedProfiles;
  }

  //Convert from HDF to ASFF
  toAsff(): IExecJSONASFF | null {
    if (this.mappings === undefined) {
      throw new Error('Mappings must be provided');
    } else {
      //Flatten Results into Control and flatten in Profiles, so all main are a single iteration
      const flattenedProfiles: object[] = this.flattenProContResV2(); //this.flattenProContRes();

      //Recursively transform the data into ASFF format
      //Returns an array of the findings
      const resList: any[] = flattenedProfiles.map((fProfile) => {
        return this.convertInternal(fProfile, this.mappings)['Findings'][0];
      });

      //Form the ASFF format of Findings mapped to the array of findings
      const finalASFF = this.finalizeASFFSchema(resList);
      console.log('Here');

      return finalASFF;
    }
  }

  finalizeASFFSchema(findingList: any[]) {
    //Finish the formatting of ASFF, assign array of finding to Findings
    return {Findings: findingList};
  }
}
