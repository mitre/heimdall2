import {encode} from 'html-entities';
import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {ILookupPath, MappedTransform} from '../base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  FROM_ASFF_TYPES_SLASH_REPLACEMENT,
  conditionallyProvideAttribute
} from '../utils/global';
import {ASFFMapper, SpecialCasing, consolidate} from './asff-mapper';

function replaceTypesSlashes<T>(type: T): T | string {
  if (!_.isString(type)) {
    return type;
  }
  return type.replace(FROM_ASFF_TYPES_SLASH_REPLACEMENT, '/');
}

function objectifyTypesArray(
  typesArray: string[] | Record<string, unknown>
): Record<string, unknown> {
  if (!Array.isArray(typesArray)) {
    typesArray = _.get(typesArray, 'FindingProviderFields.Types') as string[];
  }
  const groupedTypes = _.groupBy(typesArray, (typeString) =>
    typeString.split('/').slice(0, -1).join('/')
  );
  const ret = {};
  for (const [typeAndAttribute, values] of Object.entries(groupedTypes)) {
    _.merge(
      ret,
      ((): Record<string, unknown> => {
        const [type, attribute] = typeAndAttribute.split('/');
        let parsed = replaceTypesSlashes(
          values.map((v) => v.split('/').slice(-1)).join('')
        );
        try {
          parsed = JSON.parse(parsed);
        } catch {}
        return {[type]: {[attribute]: parsed}};
      })()
    );
  }
  return ret;
}

function findExecutionFindingIndex(
  asffOrFindings: Record<string, unknown> | Record<string, unknown>[],
  asffFindingToMatch?: {Id: string}
): number {
  if (asffFindingToMatch) {
    const targetToMatch = asffFindingToMatch.Id.split('/')[0];
    return _.findIndex(
      Array.isArray(asffOrFindings)
        ? asffOrFindings
        : (_.get(asffOrFindings, 'Findings') as Record<string, unknown>[]),
      (finding) =>
        (_.get(finding, 'Id') as string).split('/').length === 2 &&
        (_.get(finding, 'Id') as string).startsWith(targetToMatch)
    );
  }
  return _.findIndex(
    Array.isArray(asffOrFindings)
      ? asffOrFindings
      : (_.get(asffOrFindings, 'Findings') as Record<string, unknown>[]),
    (finding) => (_.get(finding, 'Id') as string).split('/').length === 2
  );
}

function preprocessingASFF(
  asff: Record<string, unknown>
): Record<string, unknown> {
  const clone = _.cloneDeep(asff);
  const index = findExecutionFindingIndex(clone);
  _.pullAt(_.get(clone, 'Findings') as Record<string, unknown>[], index);
  return clone;
}

function supportingDocs(
  input: [
    Record<string, unknown>,
    Map<SpecialCasing, Record<string, Record<string, unknown>>>
  ]
): Map<SpecialCasing, Record<string, Record<string, unknown>>> {
  const [asff, docs] = input;
  const index = findExecutionFindingIndex(asff);
  const docsClone = _.cloneDeep(docs);
  docsClone.set(SpecialCasing.PreviouslyHDF, {
    execution: _.get(asff, `Findings[${index}]`) as Record<string, unknown>
  });
  return docsClone;
}

function productName(
  findings: Record<string, unknown> | Record<string, unknown>[]
): string {
  const finding = Array.isArray(findings) ? findings[0] : findings;
  const name = _.get(finding, 'Id') as string;
  return encode(name.split('/').slice(0, 2).join(' - '));
}

function titlePrefix(): string {
  return '';
}

function code(group: ExecJSON.Control[]): string {
  return group[0].code || '';
}

function waiverData(group: ExecJSON.Control[]): ExecJSON.ControlWaiverData {
  return group[0].waiver_data || {};
}

function filename(
  findingInfo: [Record<string, unknown>, Record<string, unknown>[]]
): string {
  const index = findExecutionFindingIndex(
    findingInfo[1],
    findingInfo[0] as {Id: string}
  );

  const target = replaceTypesSlashes(
    (_.get(findingInfo[1][index], 'Id') as string).split('/')[0]
  );
  const finding = findingInfo[0];
  return `${_.get(objectifyTypesArray(finding), 'File.Input')}-${target}.json`;
}

function getCodeForProfileLayer(
  finding: Record<string, unknown>,
  profileName: string
) {
  const profileLayerToCodeMapping: Record<string, string> = {};
  (
    _.get(finding, 'Resources') as {
      Type: string;
      Id: string;
      Details?: {
        AwsIamRole?: {AssumeRolePolicyDocument: string};
      };
    }[]
  )
    .find((resource) => resource.Type === 'AwsIamRole')
    ?.Details?.AwsIamRole?.AssumeRolePolicyDocument.split(
      '=========================================================\n# Profile name: '
    )
    .filter((codeLayer) => codeLayer)
    .forEach((codeLayer) => {
      const [profileLevel, code] = codeLayer.split(
        '\n=========================================================\n\n'
      );
      profileLayerToCodeMapping[profileLevel] = code
        .split('Test Description:')[0]
        .trim();
    });
  if (profileName in profileLayerToCodeMapping) {
    return profileLayerToCodeMapping[profileName];
  } else {
    return '';
  }
}

function mapping(
  context: ASFFMapper
): MappedTransform<ExecJSON.Execution, ILookupPath> {
  const execution = _.get(
    context.supportingDocs.get(SpecialCasing.PreviouslyHDF),
    'execution'
  );
  const executionTypes = objectifyTypesArray(
    execution as Record<string, unknown>
  );
  const profileNames = Object.keys(executionTypes || {}).filter(
    (type) =>
      !['MITRE', 'File', 'Execution', 'HDF2ASFF-converter'].includes(type)
  );
  return {
    shortcircuit: true,
    platform: {
      ...(_.get(executionTypes, 'Execution.platform') as ExecJSON.Platform),
      target_id: (
        context.supportingDocs.get(SpecialCasing.PreviouslyHDF)?.execution
          .Id as string
      ).split('/')[0]
    },
    version: _.get(executionTypes, 'Execution.version'),
    statistics: _.get(executionTypes, 'Execution.statistics'),
    profiles: _.map(profileNames, (profileName: string, index: number) => {
      // order could be incorrect since we're only doing it via index instead of mapping the depends tree properly
      return {
        name: _.get(executionTypes, `${profileName}.name`),
        ...conditionallyProvideAttribute(
          'version',
          _.get(executionTypes, `${profileName}.version`),
          _.has(executionTypes, `${profileName}.version`)
        ),
        ...conditionallyProvideAttribute(
          'title',
          _.get(executionTypes, `${profileName}.title`),
          _.has(executionTypes, `${profileName}.title`)
        ),
        ...conditionallyProvideAttribute(
          'maintainer',
          _.get(executionTypes, `${profileName}.maintainer`),
          _.has(executionTypes, `${profileName}.maintainer`)
        ),
        ...conditionallyProvideAttribute(
          'summary',
          _.get(executionTypes, `${profileName}.summary`),
          _.has(executionTypes, `${profileName}.summary`)
        ),
        ...conditionallyProvideAttribute(
          'license',
          _.get(executionTypes, `${profileName}.license`),
          _.has(executionTypes, `${profileName}.license`)
        ),
        ...conditionallyProvideAttribute(
          'copyright',
          _.get(executionTypes, `${profileName}.copyright`),
          _.has(executionTypes, `${profileName}.copyright`)
        ),
        ...conditionallyProvideAttribute(
          'copyright_email',
          _.get(executionTypes, `${profileName}.copyright_email`),
          _.has(executionTypes, `${profileName}.copyright_email`)
        ),
        supports: _.get(executionTypes, `${profileName}.supports`, []),
        attributes: _.get(executionTypes, `${profileName}.attributes`, []),
        ...conditionallyProvideAttribute(
          'depends',
          _.get(executionTypes, `${profileName}.depends`),
          _.has(executionTypes, `${profileName}.depends`)
        ),
        groups: [],
        ...conditionallyProvideAttribute(
          'status',
          _.get(executionTypes, `${profileName}.status`),
          _.has(executionTypes, `${profileName}.status`)
        ),
        ...conditionallyProvideAttribute(
          'description',
          _.get(executionTypes, `${profileName}.description`),
          _.has(executionTypes, `${profileName}.description`)
        ),
        ...conditionallyProvideAttribute(
          'inspec_version',
          _.get(executionTypes, `${profileName}.inspec_version`),
          _.has(executionTypes, `${profileName}.inspec_version`)
        ),
        ...conditionallyProvideAttribute(
          'parent_profile',
          _.get(executionTypes, `${profileName}.parent_profile`),
          _.has(executionTypes, `${profileName}.parent_profile`)
        ),
        ...conditionallyProvideAttribute(
          'skip_message',
          _.get(executionTypes, `${profileName}.skip_message`),
          _.has(executionTypes, `${profileName}.skip_message`)
        ),
        ...conditionallyProvideAttribute(
          'status_message',
          _.get(executionTypes, `${profileName}.status_message`),
          _.has(executionTypes, `${profileName}.status_message`)
        ),
        controls: consolidate(
          context,
          ((): ExecJSON.Control[] => {
            return _.map(
              _.get(context.data, 'Findings') as Record<string, unknown>[],
              (finding: Record<string, unknown>) => {
                const findingTypes = objectifyTypesArray(finding);
                return {
                  id: _.get(findingTypes, 'Control.ID'),
                  ...conditionallyProvideAttribute(
                    'title',
                    _.get(findingTypes, 'Control.Title'),
                    _.has(findingTypes, 'Control.Title')
                  ),
                  ...conditionallyProvideAttribute(
                    'desc',
                    _.get(findingTypes, 'Control.Desc'),
                    _.has(findingTypes, 'Control.Desc')
                  ),
                  impact: _.get(findingTypes, 'Control.Impact'),
                  tags: {
                    ..._.omit(
                      _.get(findingTypes, 'Tags') as object | null | undefined,
                      ['nist']
                    ),
                    nist: ((): string[] => {
                      const nisttags = _.get(findingTypes, 'Tags.nist') as
                        | undefined
                        | string[];
                      if (nisttags === undefined || nisttags.length === 0) {
                        return DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
                      }
                      return nisttags;
                    })()
                  },
                  descriptions: _.map(
                    Object.entries(
                      (_.get(findingTypes, 'Descriptions') as Record<
                        string,
                        string
                      >) || {}
                    ),
                    ([key, value]) => ({label: key, data: value})
                  ),
                  refs: _.get(findingTypes, 'Control.Refs', []),
                  source_location: _.get(
                    findingTypes,
                    'Control.Source_Location',
                    {}
                  ),
                  ...conditionallyProvideAttribute(
                    'waiver_data',
                    _.get(findingTypes, 'Control.Waiver_Data'),
                    _.has(findingTypes, 'Control.Waiver_Data')
                  ),
                  code: getCodeForProfileLayer(finding, profileName), // empty string for now but gonna need to extract out of here per profile
                  // very brittle since depends on profile indexes instead of finding the baseline profile - need to do research, but could be as simple as finding the profile without any values in its depends array
                  results: (() => {
                    if (index !== profileNames.length - 1) {
                      return [];
                    }
                    const ret = [
                      {
                        code_desc: _.get(
                          findingTypes,
                          'Segment.code_desc'
                        ) as string,
                        start_time: _.get(
                          findingTypes,
                          'Segment.start_time'
                        ) as string,
                        ..._.omit(
                          _.get(findingTypes, 'Segment') as Record<
                            string,
                            unknown
                          >,
                          ['code_desc', 'start_time']
                        )
                      } as ExecJSON.ControlResult
                    ];

                    return _.has(findingTypes, 'HDF2ASFF-converter.warning')
                      ? ret.concat([
                          {
                            code_desc: '',
                            start_time: '',
                            status: ExecJSON.ControlResultStatus.Skipped,
                            skip_message:
                              'Warning: Entry was truncated when converted to ASFF (AWS Security Hub)'
                          }
                        ])
                      : ret;
                  })()
                } as ExecJSON.Control;
              }
            );
          })(),
          context.data
        ),
        sha256: _.get(executionTypes, `${profileName}.sha256`)
      } as ExecJSON.Profile;
    }),
    ...conditionallyProvideAttribute(
      'passthrough',
      _.has(executionTypes, 'HDF2ASFF-converter.warning')
        ? [
            _.get(executionTypes, 'Execution.passthrough'),
            'Warning: Entry was truncated when converted to ASFF (AWS Security Hub)'
          ]
        : _.get(executionTypes, 'Execution.passthrough'),
      _.has(executionTypes, 'Execution.passthrough')
    )
  } as MappedTransform<ExecJSON.Execution, ILookupPath>;
}

export function getPreviouslyHDF(): Record<string, (...inputs: any) => any> {
  return {
    preprocessingASFF,
    supportingDocs,
    productName,
    titlePrefix,
    code,
    waiverData,
    filename,
    mapping
  };
}
