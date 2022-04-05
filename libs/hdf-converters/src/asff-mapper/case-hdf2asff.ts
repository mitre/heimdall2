import {encode} from 'html-entities';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {ILookupPath, MappedTransform} from '../base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  FROM_ASFF_TYPES_SLASH_REPLACEMENT
} from '../utils/global';
import {ASFFMapper, consolidate, SpecialCasing} from './asff-mapper';

function replaceTypesSlashes<T>(type: T): T | string {
  if (!_.isString(type)) {
    return type;
  }
  return type.replace(FROM_ASFF_TYPES_SLASH_REPLACEMENT, '/');
}

function objectifyTypesArray(
  typesArray: string[] | Record<string, unknown>
): Record<string, Record<string, unknown>> {
  if (!Array.isArray(typesArray)) {
    typesArray = _.get(typesArray, 'FindingProviderFields.Types') as string[];
  }
  const ret = {};
  for (const typeString of typesArray) {
    _.merge(
      ret,
      ((): Record<string, unknown> => {
        const [type, attribute, value] = typeString.split('/');
        let parsed = replaceTypesSlashes(value);
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
  docsClone.set(SpecialCasing.HDF2ASFF, {
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

function doesNotHaveFindingTitlePrefix(): boolean {
  return true;
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

function mapping(
  context: ASFFMapper
): MappedTransform<ExecJSON.Execution, ILookupPath> {
  const execution = _.get(
    context.supportingDocs.get(SpecialCasing.HDF2ASFF),
    'execution'
  );
  const executionTypes = objectifyTypesArray(
    execution as Record<string, unknown>
  );
  const profileNames = Object.keys(executionTypes || {}).filter(
    (type) => !['MITRE', 'File', 'Execution'].includes(type)
  );
  return {
    shortcircuit: true,
    platform: {
      ..._.get(executionTypes, 'Execution.platform'),
      target_id: (
        context.supportingDocs.get(SpecialCasing.HDF2ASFF)?.execution
          .Id as string
      ).split('/')[0]
    } as unknown as ExecJSON.Platform,
    version: _.get(executionTypes, 'Execution.version') as unknown as string,
    statistics: _.get(
      executionTypes,
      'Execution.statistics'
    ) as unknown as ExecJSON.Statistics,
    /*
      NOTE: waiting on inspecjs to include passthrough as a potential value in the type
      ...(_.has(executionTypes, 'Execution.passthrough') && {passthrough: _.get(executionTypes, 'Execution.passthrough')}),
      */
    profiles: _.map(profileNames, (profileName: string, index: number) => {
      // order could be incorrect since we're only doing it via index instead of mapping the depends tree properly
      return {
        name: _.get(executionTypes, `${profileName}.name`),
        version: _.get(executionTypes, `${profileName}.version`),
        title: _.get(executionTypes, `${profileName}.title`),
        maintainer: _.get(executionTypes, `${profileName}.maintainer`),
        summary: _.get(executionTypes, `${profileName}.summary`),
        license: _.get(executionTypes, `${profileName}.license`),
        copyright: _.get(executionTypes, `${profileName}.copyright`),
        copyright_email: _.get(
          executionTypes,
          `${profileName}.copyright_email`
        ),
        supports: _.get(
          executionTypes,
          `${profileName}.supports`,
          []
        ) as ExecJSON.SupportedPlatform[],
        attributes: _.get(
          executionTypes,
          `${profileName}.attributes`,
          []
        ) as Record<string, unknown>[],
        depends: _.get(executionTypes, `${profileName}.depends`) as any,
        groups: [],
        status: _.get(executionTypes, `${profileName}.status`),
        description: _.get(executionTypes, `${profileName}.description`),
        inspec_version: _.get(executionTypes, `${profileName}.inspec_version`),
        parent_profile: _.get(executionTypes, `${profileName}.parent_profile`),
        skip_message: _.get(executionTypes, `${profileName}.skip_message`),
        status_message: _.get(executionTypes, `${profileName}.status_message`),
        controls: consolidate(
          context,
          ((): ExecJSON.Control[] => {
            return _.map(
              _.get(context.data, 'Findings') as Record<string, unknown>[],
              (finding: Record<string, unknown>) => {
                const findingTypes = objectifyTypesArray(finding);
                return {
                  id: _.get(findingTypes, 'Control.ID') as unknown as string,
                  ...(_.has(findingTypes, 'Control.Title') && {
                    title: _.get(
                      findingTypes,
                      'Control.Title'
                    ) as unknown as string
                  }),
                  ...(_.has(findingTypes, 'Control.Desc') && {
                    desc: _.get(
                      findingTypes,
                      'Control.Desc'
                    ) as unknown as string
                  }),
                  impact: _.get(
                    findingTypes,
                    'Control.Impact'
                  ) as unknown as number,
                  tags: {
                    ..._.omit(_.get(findingTypes, 'Tags'), ['nist']),
                    nist: ((): string[] => {
                      const nisttags = _.get(
                        findingTypes,
                        'Tags.nist'
                      ) as unknown as undefined | string[];
                      if (nisttags === undefined || nisttags.length === 0) {
                        return DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
                      } else {
                        return nisttags;
                      }
                    })()
                  },
                  descriptions: _.map(
                    Object.entries(_.get(findingTypes, 'Descriptions') || {}),
                    ([key, value]) => ({label: key, data: value as string})
                  ),
                  refs: _.get(
                    findingTypes,
                    'Control.Refs',
                    []
                  ) as ExecJSON.Reference[],
                  source_location: _.get(
                    findingTypes,
                    'Control.Source_Location',
                    {}
                  ) as ExecJSON.SourceLocation,
                  ...(_.has(findingTypes, 'Control.Waiver_Data') && {
                    waiver_data: _.get(
                      findingTypes,
                      'Control.Waiver_Data'
                    ) as unknown as ExecJSON.ControlWaiverData
                  }),
                  code: '', // empty string for now but gonna need to extract out of here per profile
                  // very brittle since depends on profile indexes instead of finding the baseline profile - need to do research, but could be as simple as finding the profile without any values in its depends array
                  results:
                    index === profileNames.length - 1
                      ? [
                          {
                            code_desc: _.get(
                              findingTypes,
                              'Segment.code_desc'
                            ) as unknown as string,
                            start_time: _.get(
                              findingTypes,
                              'Segment.start_time'
                            ) as unknown as string,
                            ..._.omit(_.get(findingTypes, 'Segment'), [
                              'code_desc',
                              'start_time'
                            ])
                          }
                        ]
                      : []
                };
              }
            );
          })(),
          context.data
        ),
        sha256: _.get(executionTypes, `${profileName}.sha256`)
      };
    })
  } as MappedTransform<ExecJSON.Execution, ILookupPath>;
}

export function getHDF2ASFF(): Record<string, (...inputs: any) => any> {
  return {
    preprocessingASFF,
    supportingDocs,
    productName,
    doesNotHaveFindingTitlePrefix,
    code,
    waiverData,
    filename,
    mapping
  };
}
