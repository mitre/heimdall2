import {contextualizeEvaluation, ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {MappedTransform} from '../../base-converter';
import {FromHdfBaseConverter} from '../reverse-base-converter';
import {IExecJSONASFF, IFindingASFF, IOptions} from './asff-types';
import {
  createProfileInfoFinding,
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

export const TO_ASFF_TYPES_SLASH_REPLACEMENT = '{{{SLASH}}}'; // The "Types" field of ASFF only supports a maximum of 2 slashes, and will get replaced with this text. Note that the default AWS CLI doesn't support UTF-8 encoding

export function escapeForwardSlashes<T>(s: T): T {
  return _.isString(s)
    ? (s.replace(/\//g, TO_ASFF_TYPES_SLASH_REPLACEMENT) as unknown as T)
    : (JSON.stringify(s).replace(
        /\//g,
        TO_ASFF_TYPES_SLASH_REPLACEMENT
      ) as unknown as T);
}

export type SegmentedControl = ExecJSON.Control & {
  result: ExecJSON.ControlResult;
  layersOfControl: (ExecJSON.Control & {
    fix?: string;
    profileInfo?: Record<string, unknown>;
  })[];
};

export interface ILookupPathASFF {
  path?: string;
  transformer?: (
    value: SegmentedControl,
    context?: FromHdfToAsffMapper
  ) => unknown;
  arrayTransformer?: (value: unknown[], file: ExecJSON.Execution) => unknown[];
  key?: string;
  passParent?: boolean;
}

export class FromHdfToAsffMapper extends FromHdfBaseConverter {
  mappings: () => MappedTransform<IExecJSONASFF, ILookupPathASFF> = () => ({
    Findings: [
      {
        SchemaVersion: '2018-10-08',
        Id: {path: '', transformer: setupId, passParent: true},
        ProductArn: {path: '', transformer: setupProductARN, passParent: true},
        AwsAccountId: {path: '', transformer: setupAwsAcct, passParent: true},
        Types: {
          transformer: () => ['Software and Configuration Checks']
        },
        CreatedAt: {path: '', transformer: setupCreated},
        UpdatedAt: {path: '', transformer: setupUpdated, passParent: true},
        ...(this.ioptions.regionAttribute && {
          Region: {path: '', transformer: setupRegion, passParent: true}
        }),
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
            transformer: () => [
              'SEE REMEDIATION FIELD FOR RESULTS AND RECOMMENDED ACTION(S)'
            ]
          },
          Status: {path: '', transformer: setupControlStatus}
        }
      }
    ]
  });

  contextProfiles: any;
  counts: any;
  ioptions: IOptions;
  index?: number;

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
    this.counts = statusCount(contextualizeEvaluation(hdfObj));
  }

  defaultOptions(): IOptions {
    return {
      input: '',
      awsAccountId: '',
      target: 'default',
      region: '',
      regionAttribute: false
    };
  }

  setMappings(
    customMappings: MappedTransform<IExecJSONASFF, ILookupPathASFF>
  ): void {
    super.setMappings(customMappings);
  }

  // Security hub currently works at the sub-control level, meaning we need to create our mapped data based off control.results
  controlsToSegments() {
    const segments: SegmentedControl[] = [];
    this.data.profiles.forEach((profile) => {
      profile.controls.reverse().forEach((control) => {
        control.results.forEach((segment) => {
          // Ensure that the UpdatedAt time is different across findings (to match the order in HDF)
          segments.push({
            ...control,
            result: segment,
            layersOfControl: getAllLayers(this.data, control)
          });
        });
      });
    });

    return segments;
  }

  // Any ASFF value has to be less than 32768B - we're setting the max size to 30KB to have some buffer.  Only enforcing this restriction in AssumeRolePolicyDocument and FindingProviderFields.Types for now.
  restrictionAttributesLessThan32KiB(finding: IFindingASFF): IFindingASFF {
    const ATTRIBUTE_CHARACTER_LIMIT = 30000;
    if (finding.Resources.length > 1) {
      _.set(
        finding,
        'Resources[1].Details.AwsIamRole.AssumeRolePolicyDocument',
        (
          _.get(
            finding,
            'Resources[1].Details.AwsIamRole.AssumeRolePolicyDocument',
            ''
          ) as unknown as string
        ).slice(0, ATTRIBUTE_CHARACTER_LIMIT)
      );
      // no need for truncation warning since AssumeRolePolicyDocument is only used to look nice in the GUI - FindingProviderFields.Types contains all the information
    }
    finding.FindingProviderFields.Types = (
      finding.FindingProviderFields.Types as string[]
    )
      .map((typeString) => {
        if (typeString.length <= ATTRIBUTE_CHARACTER_LIMIT) {
          return typeString;
        }
        const [type, attribute, value] = typeString.split('/');
        return _.chunk(
          value,
          ATTRIBUTE_CHARACTER_LIMIT -
            (type.length + attribute.length + 2) /*the slashes*/
        ).map((chunk) => `${type}/${attribute}/${chunk.join('')}`);
      })
      .flat();
    return finding;
  }

  // Findings have a maximum size of 240KB.  To try to meet that requirement, SecHub automatically removes the Resource.Details object, but we don't put anything there so we gotta find space savings elsewhere: we can't remove anything from what'll show up nice in the GUI for the user since they need all that info to have a useable experience in SecHub, so instead we're going to remove the flattened HDF file that's in the FindingProviderFields.Types array starting from the least important stuff.  We're setting the max size to 200KB since anything much more than that doesn't seem to actually show up in SecHub even if there are no errors reported on upload.
  restrictionFindingLessThan240KB(
    profileInfoFindingId: string,
    finding: IFindingASFF,
    numRemoved: number,
    numTruncated: number
  ): [IFindingASFF | undefined, number, number] {
    const SIZE_CAP = 200000;
    const originalSize = new TextEncoder().encode(
      JSON.stringify(finding)
    ).length;
    let size = originalSize;
    let popped;
    while (
      size > SIZE_CAP &&
      (finding.FindingProviderFields.Types as string[]).length > 0
    ) {
      popped = (finding.FindingProviderFields.Types as string[]).pop();
      size = new TextEncoder().encode(JSON.stringify(finding)).length;
    }
    if (size > SIZE_CAP) {
      console.error(
        `Warning: Normalized entry could not be sufficiently reduced in size to meet AWS Security Hub requirements and so will not be provided in the results set.  Entry could not be minimized more than as follows:
            ${finding}`
      );
      if (finding.Id === profileInfoFindingId) {
        console.error(
          'Warning: This was the informational entry that contains the scan/execution level information.'
        );
      }
      if (finding.Id !== profileInfoFindingId) {
        // metrics are only for non-profile info findings
        numRemoved++;
      }
      return [undefined, numRemoved, numTruncated];
    }
    if (originalSize !== size) {
      (finding.FindingProviderFields.Types as string[]).push(
        new TextDecoder().decode(
          new TextEncoder().encode(popped).subarray(0, SIZE_CAP - size)
        )
      );
      (finding.FindingProviderFields.Types as string[]).push(
        'HDF2ASFF-converter/warning/Not all information was captured in this entry.  Please consult the original file for all of the information.'
      );
      console.error(
        `Warning: Normalized entry was truncated in size to meet AWS Security Hub requirements.  Entry id: ${finding.Id}`
      );
      if (finding.Id !== profileInfoFindingId) {
        numTruncated++;
      }
    }
    return [finding, numRemoved, numTruncated];
  }

  // FindingProviderFields.Types has a maximum size of 50 attributes
  restrictionTypesArrayLengthLessThan50(
    profileInfoFindingId: string,
    finding: IFindingASFF,
    numTruncated: number
  ): [IFindingASFF, number] {
    const cutoff = (finding.FindingProviderFields.Types as string[]).splice(
      50,
      (finding.FindingProviderFields.Types as string[]).length - 50
    );
    if (cutoff.length > 0) {
      (finding.FindingProviderFields.Types as string[]).pop();
      (finding.FindingProviderFields.Types as string[]).push(
        `HDF2ASFF-converter/warning/Not all information was captured in this entry.  Please consult the original file for all of the information.`
      );
      console.error(
        `Warning: Normalized entry was truncated in size to meet AWS Security Hub requirements.  Entry id: ${finding.Id}`
      );
      if (finding.Id !== profileInfoFindingId) {
        numTruncated++;
      }
    }
    return [finding, numTruncated];
  }

  // SecHub doesn't allow two types to have the same values; future iteration should find a way to work around this instead of just skipping it like we're going to do here (maybe add a number of {MAKE LINE DIFFERENT} block things at the end of an otherwise same line that'll get removed by the asff2hdf mapper similar to how we do the slash substitutions
  restrictionTypesArrayMustBeUnique(
    profileInfoFindingId: string,
    finding: IFindingASFF,
    numRemoved: number
  ): [IFindingASFF | undefined, number] {
    if (
      (finding.FindingProviderFields.Types as string[]).length !==
      new Set(finding.FindingProviderFields.Types as string[]).size
    ) {
      console.error(
        `Warning: Normalized entry contained data that is duplicated (i.e. a subsection of a string by happenstance has the same values) which means this entry does not meet AWS Security Hub requirements and so will not be provided in the results set.  Entry that contains duplicate data is as follows:
            ${finding}`
      );
      if (finding.Id === profileInfoFindingId) {
        console.error(
          'Warning: This was the informational entry that contains the scan/execution level information.'
        );
      }
      if (finding.Id !== profileInfoFindingId) {
        numRemoved++;
      }
      return [undefined, numRemoved];
    }
    return [finding, numRemoved];
  }

  // ASFF has several written and unwritten restrictions that cap how much information can be put into a finding
  restrictToSchemaSizes(resList: IFindingASFF[]): IFindingASFF[] {
    const profileInfoFindingId = resList.slice(-1)[0].Id;
    let numRemoved = 0;
    let numTruncated = 0;
    const restrictedResults: IFindingASFF[] = [];
    for (const f of resList) {
      let finding: IFindingASFF | undefined = f;
      finding = this.restrictionAttributesLessThan32KiB(finding);
      [finding, numRemoved, numTruncated] =
        this.restrictionFindingLessThan240KB(
          profileInfoFindingId,
          finding,
          numRemoved,
          numTruncated
        );
      if (!finding) {
        continue;
      }
      [finding, numTruncated] = this.restrictionTypesArrayLengthLessThan50(
        profileInfoFindingId,
        finding,
        numTruncated
      );
      [finding, numRemoved] = this.restrictionTypesArrayMustBeUnique(
        profileInfoFindingId,
        finding,
        numRemoved
      );
      if (!finding) {
        continue;
      }
      restrictedResults.push(finding);
    }

    if (
      (numRemoved > 0 || numTruncated > 0) &&
      restrictedResults.slice(-1)[0].Id === profileInfoFindingId
    ) {
      restrictedResults.slice(-1)[0].Description = `${
        restrictedResults.slice(-1)[0].Description
      } ---- MITRE SAF HDF2ASFF converter warnings -- Entries truncated: ${numTruncated} (Truncated to fit AWS Security Hub restrictions) --- Entries removed: ${numRemoved} (Could not fit due to AWS Security Hub restrictions)`;
    }

    return restrictedResults;
  }

  //Convert from HDF to ASFF
  toAsff(): IFindingASFF[] {
    if (this.mappings() === undefined) {
      throw new Error('Mappings must be provided');
    } else {
      //Recursively transform the data into ASFF format
      //Returns an array of the findings
      let resList: IFindingASFF[] = this.controlsToSegments().map(
        (segment, index) => {
          this.index = index;
          return this.convertInternal(segment, this.mappings())[
            'Findings'
          ][0] as IFindingASFF;
        }
      );
      resList.push(createProfileInfoFinding(this.data, this.ioptions));

      resList = this.restrictToSchemaSizes(resList);

      return resList;
    }
  }
}
