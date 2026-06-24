import { createHash } from 'crypto';
import type {
  ContextualizedControl,
  ContextualizedEvaluation,
  HDFControlSegment,
} from 'inspecjs';
import {
  contextualizeEvaluation,
  convertFile,
  ExecJSON,
} from 'inspecjs';
import * as _ from 'lodash';
import moment from 'moment';
import { getDescription, HeimdallToolsVersion } from '../../utils/global';
import type { IFindingASFF, IOptions } from './asff-types';
import type {
  FromHdfToAsffMapper,
  SegmentedControl,
} from './reverse-asff-mapper';
import { escapeForwardSlashes } from './reverse-asff-mapper';

// FromHdfToAsff mapper transformers
type Counts = {
  Failed: number;
  FailedTests: number;
  NotApplicable: number;
  NotReviewed: number;
  Passed: number;
  PassedTests: number;
  PassingTestsFailedControl: number;
};

export function getRunTime(hdf: ExecJSON.Execution): string {
  let time = new Date().toISOString();
  for (const profile of hdf.profiles) {
    if (
      profile.controls[0]
      && profile.controls[0].results.length > 0
      && profile.controls[0].results[0].start_time
    ) {
      try {
        time = new Date(
          profile.controls[0].results[0].start_time,
        ).toISOString();
      } catch {
        time = new Date().toISOString();
      }
    }
  }
  return time;
}

/** Trivial overlay filter that just takes the version of the control that has results from amongst all identical ids */
function filter_overlays(
  controls: ContextualizedControl[],
): ContextualizedControl[] {
  const idHash: Record<string, ContextualizedControl> = {};
  for (const c of controls) {
    const id = c.hdf.wraps.id;
    const old: ContextualizedControl | undefined = idHash[id];
    // If old, gotta check if our new status list is "better than" old
    if (old) {
      const newSignificant = c.hdf.status_list && c.hdf.status_list.length > 0;
      if (newSignificant) {
        // Overwrite
        idHash[id] = c;
      }
    } else {
      // First time seeing this id
      idHash[id] = c;
    }
  }

  // Return the set of keys
  return Object.values(idHash);
}

export function createProfileInfoFinding(
  hdf: ExecJSON.Execution,
  options: IOptions,
): IFindingASFF {
  const runTime = getRunTime(hdf);
  const inspecJSJson = convertFile(JSON.stringify(hdf));
  const contextualizedEvaluation = contextualizeEvaluation(
    inspecJSJson['1_0_ExecJson'] as any,
  );
  const counts = statusCount(contextualizedEvaluation);
  const updatedAt = new Date();
  updatedAt.setMilliseconds(
    updatedAt.getMilliseconds()
    + (contextualizedEvaluation.contains[0].contains.length || 0),
  );
  const profileInfo: Record<string, unknown> = {
    AwsAccountId: options.awsAccountId,
    CreatedAt: runTime,
    Description: createDescription(counts),
    FindingProviderFields: {
      Severity: { Label: 'INFORMATIONAL' },
      Types: createProfileInfoFindingFields(hdf, options),
    },
    GeneratorId: `arn:aws:securityhub:us-east-2:${options.awsAccountId}:ruleset/set/${hdf.profiles[0].name}`,
    Id: `${options.target}/${hdf.profiles[0].name}`,
    ProductArn: `arn:aws:securityhub:${options.region}:${options.awsAccountId}:product/${options.awsAccountId}/default`,
    Resources: [
      {
        Id: `AWS::::Account:${options.awsAccountId}`,
        Partition: 'aws',
        Region: options.region,
        Type: 'AwsAccount',
      },
    ],
    SchemaVersion: '2018-10-08',
    Severity: { Label: 'INFORMATIONAL' },
    Title: `${options.target} | ${hdf.profiles[0].name} | ${moment().format(
      'YYYY-MM-DD hh:mm:ss [GMT]ZZ',
    )}`,
    UpdatedAt: updatedAt,
  };

  // need the intermediate caste to tell typescript that this cast is intentional
  return profileInfo as unknown as IFindingASFF;
}

export function statusCount(evaluation: ContextualizedEvaluation): Counts {
  let controls: ContextualizedControl[] = [];
  // Get all controls
  for (const p of evaluation.contains) {
    controls.push(...p.contains);
  }
  controls = filter_overlays(controls);
  const statusCounts: Counts = {
    Failed: 0,
    FailedTests: 0,
    NotApplicable: 0,
    NotReviewed: 0,
    Passed: 0,
    PassedTests: 0,
    PassingTestsFailedControl: 0,
  };
  for (const control of controls) {
    switch (control.hdf.status) {
      case 'Failed': {
        statusCounts.PassingTestsFailedControl += (
          control.hdf.segments || []
        ).filter((s: HDFControlSegment) => s.status === 'passed').length;
        statusCounts.FailedTests += (control.hdf.segments || []).filter(
          (s: HDFControlSegment) => s.status === 'failed',
        ).length;
        statusCounts.Failed += 1;

        break;
      }
      case 'Not Applicable': {
        statusCounts.NotApplicable += 1;

        break;
      }
      case 'Not Reviewed': {
        statusCounts.NotReviewed += 1;

        break;
      }
      case 'Passed': {
        statusCounts.Passed += 1;
        statusCounts.PassedTests += (control.hdf.segments || []).length;

        break;
      }
    // No default
    }
  }
  return statusCounts;
}

export function createDescription(counts: Counts): string {
  return `Result Set Status Summary -- Passed: ${counts.Passed} (${
    counts.PassedTests
  } individual checks passed) --- Failed: ${counts.Failed} (${
    counts.PassingTestsFailedControl
  } individual checks failed out of ${
    counts.PassingTestsFailedControl + counts.FailedTests
  } total checks) --- Not Applicable: ${
    counts.NotApplicable
  } (System exception or absent component) --- Not Reviewed: ${
    counts.NotReviewed
  } (Can only be tested manually at this time)`;
}

export function createAssumeRolePolicyDocument(
  layersOfControl: ExecJSON.Control[],
  segment: ExecJSON.ControlResult,
): string {
  const segmentOverview = createNote(segment);
  const code = layersOfControl.map(layer => createCode(layer)).join('\n\n');
  return `${code}\n\n${segmentOverview}`;
}

// Gets rid of extra spacing + newlines as these aren't shown in Security Hub
export function cleanText(text?: null | string): string | undefined {
  return text ? text.replaceAll(/ {2,}/gv, ' ') : undefined;
}

// Gets all layers of a control across overlaid profiles given the ID
export function getAllLayers(
  hdf: ExecJSON.Execution,
  knownControl: ExecJSON.Control,
): (ExecJSON.Control & Record<string, unknown>)[] {
  if (hdf.profiles.length === 1) {
    return [
      {
        ...knownControl,
        profileInfo: { ..._.omit(hdf.profiles[0], 'controls') },
      },
    ];
  }
  const foundControls: (ExecJSON.Control & Record<string, unknown>)[] = [];
  for (const profile of hdf.profiles) {
    for (const control of profile.controls) {
      if (control.id === knownControl.id) {
        foundControls.push({
          ...control,
          profileInfo: { ..._.omit(profile, 'controls') },
        });
      }
    }
  }
  return foundControls;
}

// Creates Note field containing control status
export function createNote(segment: ExecJSON.ControlResult) {
  if (segment.message) {
    return `Test Description: ${segment.code_desc} --- Test Result: ${segment.message}`;
  }
  return segment.skip_message ? `Test Description: ${segment.code_desc} --- Skip Message: ${segment.skip_message}` : `Test Description: ${segment.code_desc}`;
}

function shouldCleanObjectValues<T>(value: T): boolean {
  if (Array.isArray(value)) {
    return value.length < 0;
  }
  return !value;
}

export function createCode(
  control: ExecJSON.Control & { profileInfo?: Record<string, unknown> },
) {
  const noCodeValue
    = ((_.get(control, 'profileInfo.depends') || []) as Record<string, unknown>[])
      .length > 0
      ? ''
      : JSON.stringify(
        _.omitBy(
          _.omit(control, ['results', 'profileInfo']),
          shouldCleanObjectValues,
        ),
      );
  if (!control.code && noCodeValue === '') {
    return '';
  }
  return `=========================================================\n# Profile name: ${
    control.profileInfo?.name ?? ''
  }\n=========================================================\n\n${
    control.code ? control.code?.replaceAll(String.raw`\"`, '"') : noCodeValue
  }`;
}

export function setupId(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  const target = context?.ioptions.target;
  const name = context?.data.profiles[0].name;

  return `${target}/${name}/${control.id}/finding/${createHash('sha256')
    .update(control.id + control.result.code_desc)
    .digest('hex')}`;
}

export function setupProductARN(
  _val: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  return `arn:aws:securityhub:${context?.ioptions.region}:${context?.ioptions.awsAccountId}:product/${context?.ioptions.awsAccountId}/default`;
}

export function setupAwsAcct(
  _val: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  return context?.ioptions.awsAccountId;
}

export function setupCreated(control: SegmentedControl) {
  try {
    return (
      new Date(control.result.start_time).toISOString()
        || new Date().toISOString()
    );
  } catch {
    return new Date().toISOString();
  }
}

export function setupRegion(
  _val: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  return context?.ioptions.region;
}
export function setupUpdated(
  _control: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  // Add one millisecond to the time by control index so the order is correct in security hub
  const time = new Date();
  time.setMilliseconds(time.getMilliseconds() + (context?.index || 0));
  return time.toISOString();
}

export function setupGeneratorId(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  return `arn:aws:securityhub:${context?.ioptions.region}:${context?.ioptions.awsAccountId}:ruleset/set/${context?.data.profiles[0].name}/rule/${control.id}`;
}

export function setupTitle(control: SegmentedControl) {
  const nistTags = control.tags.nist ? `[${control.tags.nist.join(', ')}]` : '';
  return _.truncate(
    `${control.id} | ${nistTags} | ${cleanText(control.title)}`,
    { length: 256 },
  );
}

export function setupDescr(control: SegmentedControl) {
  // Check text can either be a description or a tag
  const checkText: string
    = getDescription(control.descriptions || [], 'check')
      || (control.tags.check as string)
      || 'Check not available';

  const currentVal = _.truncate(
    cleanText(`${control.desc} -- Check Text: ${checkText}`),
    { length: 1024, omission: '[SEE FULL TEXT IN AssumeRolePolicyDocument]' },
  );

  const caveat = getDescription(control.descriptions || [], 'caveat');

  if (caveat) {
    return _.truncate(
      `Caveat: ${cleanText(caveat)} --- Description: ${currentVal}`,
      { length: 1024, omission: '' },
    );
  }
  return currentVal;
}

export function setupSevLabel(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  return context?.impactMapping.get(control.impact) || 'INFORMATIONAL';
}

export function setupSevOriginal(control: SegmentedControl) {
  return String(control.impact);
}

function createControlMetadata(control: SegmentedControl) {
  const types = [
    `Control/ID/${escapeForwardSlashes(control.id)}`,
    `Control/Impact/${control.impact}`,
  ];
  if (control.title) {
    types.push(`Control/Title/${escapeForwardSlashes(control.title)}`);
  }
  if (control.desc) {
    types.push(`Control/Desc/${escapeForwardSlashes(control.desc)}`);
  }
  if (control.waiver_data && Object.keys(control.waiver_data).length > 0) {
    types.push(
      `Control/Waiver_Data/${escapeForwardSlashes(
        JSON.stringify(control.waiver_data),
      )}`,
    );
  }
  if (control.attestation_data) {
    types.push(
      `Control/Attestation_Data/${escapeForwardSlashes(
        JSON.stringify(control.attestation_data),
      )}`,
    );
  }
  if (control.refs && control.refs.length > 0) {
    types.push(
      `Control/Refs/${escapeForwardSlashes(JSON.stringify(control.refs))}`,
    );
  }
  if (
    control.source_location
    && Object.keys(control.source_location).length > 0
  ) {
    types.push(
      `Control/Source_Location/${escapeForwardSlashes(
        JSON.stringify(control.source_location),
      )}`,
    );
  }
  return types;
}

function getFilename(options?: IOptions): string {
  const slashSplit
    = options?.input.split('\\')[options?.input.split('\\').length - 1];
  return slashSplit?.split('/')[slashSplit.split('/').length - 1] ?? '';
}

function createProfileInfoFindingFields(
  hdf: ExecJSON.Execution,
  options: IOptions,
): string[] {
  const typesArr = [
    `MITRE/SAF/${HeimdallToolsVersion}-hdf2asff`,
    `File/Input/${getFilename(options)}`,
  ];
  const executionTargets = ['platform', 'statistics', 'version'];
  for (const target of executionTargets) {
    const value = _.get(hdf, target);
    if (_.isString(value) && value.trim()) {
      typesArr.push(
        `Execution/${escapeForwardSlashes(target)}/${escapeForwardSlashes(
          value,
        )}`,
      );
    } else {
      typesArr.push(
        `Execution/${escapeForwardSlashes(target)}/${escapeForwardSlashes(
          JSON.stringify(value),
        )}`,
      );
    }
  }
  for (const profile of hdf.profiles) {
    const targets = [
      'version',
      'sha256',
      'maintainer',
      'summary',
      'license',
      'copyright',
      'copyright_email',
      'name',
      'title',
      'depends',
      'supports',
      'attributes',
      'description',
      'inspec_version',
      'parent_profile',
      'skip_message',
      'status',
      'status_message',
    ];
    for (const target of targets) {
      const value = _.get(profile, target);
      if (typeof value === 'string' && value) {
        typesArr.push(
          `${escapeForwardSlashes(profile.name)}/${escapeForwardSlashes(
            target,
          )}/${escapeForwardSlashes(value)}`,
        );
      } else if (typeof value === 'object') {
        typesArr.push(
          `${escapeForwardSlashes(profile.name)}/${escapeForwardSlashes(
            target,
          )}/${escapeForwardSlashes(JSON.stringify(value))}`,
        );
      }
    }
  }
  const passthrough = _.get(hdf, 'passthrough');
  if (_.isString(passthrough) && passthrough.trim()) {
    typesArr.push(`Execution/passthrough/${escapeForwardSlashes(passthrough)}`);
  } else if (passthrough !== undefined) {
    typesArr.push(
      `Execution/passthrough/${escapeForwardSlashes(
        JSON.stringify(passthrough),
      )}`,
    );
  }
  return typesArr;
}

function createSegmentInfo(segment: ExecJSON.ControlResult): string[] {
  const typesArr: string[] = [];
  const targets = [
    'backtrace',
    'exception',
    'code_desc',
    'message',
    'resource',
    'run_time',
    'start_time',
    'skip_message',
    'status',
  ];
  for (const target of targets) {
    if (_.has(segment, target) && _.get(segment, target) !== undefined) {
      if (_.get(segment, target) === '') {
        typesArr.push(`Segment/${escapeForwardSlashes(target)}/''`);
      } else {
        typesArr.push(
          `Segment/${escapeForwardSlashes(target)}/${escapeForwardSlashes(
            String(_.get(segment, target)),
          )}`,
        );
      }
    }
  }
  return typesArr;
}

function createTagInfo(control: { tags: Record<string, unknown> }): string[] {
  const typesArr: string[] = [];
  for (const tag in control.tags) {
    typesArr.push(
      `Tags/${escapeForwardSlashes(tag)}/${escapeForwardSlashes(
        JSON.stringify(control.tags[tag]),
      )}`,
    );
  }
  return typesArr;
}

function createDescriptionInfo(control: ExecJSON.Control): string[] {
  const typesArr: string[] = [];
  if (Array.isArray(control.descriptions)) {
    if (control.descriptions) {
      for (const description of control.descriptions) {
        if (description.data && cleanText(description.data)) {
          typesArr.push(
            `Descriptions/${escapeForwardSlashes(
              description.label,
            )}/${escapeForwardSlashes(cleanText(description.data))}`,
          );
        }
      }
    }
  } else {
    for (const [key, value] of Object.entries(control.descriptions || {})) {
      if (value && cleanText(value as string)) {
        typesArr.push(
          `Descriptions/${escapeForwardSlashes(key)}/${escapeForwardSlashes(
            cleanText(value as string),
          )}`,
        );
      }
    }
  }

  return typesArr;
}

export function setupFindingType(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  // typesArr needs to be ordered so that attributes that are likely to be bloated and/or contain less necessary information end up at the bottom so that they don't expand and push more attributes outside of the list which is capped at 50 items
  const typesArr = [
    `MITRE/SAF/${HeimdallToolsVersion}-hdf2asff`,
    `File/Input/${getFilename(context?.ioptions)}`,
    ...createControlMetadata(control),
    ...createSegmentInfo(control.result),
    ...createTagInfo(control),
  ];

  // nist tag, then subdescriptions, then remaining tags
  const nistTagIndex = typesArr.findIndex(typeString =>
    typeString.startsWith('Tags/nist/'),
  );
  const tagsIndex = typesArr.findIndex(typeString =>
    typeString.startsWith('Tags/'),
  );
  if (nistTagIndex !== -1) {
    typesArr.splice(tagsIndex, 0, typesArr.splice(nistTagIndex, 1)[0]);
  }
  typesArr.splice(
    tagsIndex === -1 ? typesArr.length : tagsIndex + 1,
    0,
    // Add Descriptions to FindingProviderFields
    ...createDescriptionInfo(control),
  );

  // description, then code, then code_desc
  const desc = typesArr.splice(
    typesArr.findIndex(typeString => typeString.startsWith('Control/Desc/')),
    1,
  )[0];
  const code = `Control/Code/${escapeForwardSlashes(
    control.layersOfControl
      .map(
        (layer: ExecJSON.Control & { profileInfo?: Record<string, unknown> }) =>
          createCode(layer),
      )
      .join('\n\n'),
  )}`;
  const codeDesc = typesArr.splice(
    typesArr.findIndex(typeString =>
      typeString.startsWith('Segment/code_desc/'),
    ),
    1,
  )[0];
  typesArr.push(..._.compact([desc, code, codeDesc])); // [][0] can return undefined so use compact to deal with them

  return typesArr;
}

export function getFixForControl(control: SegmentedControl) {
  return (
    getDescription(control.descriptions || [], 'fix')
    || control.tags.fix
    || 'Fix not available'
  );
}

export function setupRemRec(control: SegmentedControl) {
  return _.truncate(
    cleanText(
      `${createNote(control.result)} --- Fix: ${getFixForControl(control)}`,
    ),
    { length: 512, omission: '... [SEE FULL TEXT IN AssumeRolePolicyDocument]' },
  );
}

export function setupProdFieldCheck(control: SegmentedControl) {
  const checkText: string
    = getDescription(control.descriptions || [], 'check')
      || (control.tags.check as string)
      || 'Check not available';

  return _.truncate(checkText, { length: 2048, omission: '' });
}

export function setupResourcesID(
  _val: SegmentedControl,
  context?: FromHdfToAsffMapper,
) {
  return `AWS::::Account:${context?.ioptions.awsAccountId}`;
}

export function setupResourcesID2(control: SegmentedControl) {
  return `${control.id} Validation Code`;
}

export function setupDetailsAssume(control: SegmentedControl) {
  return createAssumeRolePolicyDocument(
    control.layersOfControl,
    control.result,
  );
}

export function setupControlStatus(control: SegmentedControl) {
  if (control.results.some(result => 'backtrace' in result)) {
    return 'NOT_AVAILABLE';
  }
  const status: boolean | string
    = control.result.status === ExecJSON.ControlResultStatus.Skipped
      ? 'WARNING'
      : control.result.status === ExecJSON.ControlResultStatus.Passed;
  if (typeof status === 'boolean') {
    return status ? 'PASSED' : 'FAILED';
  }
  return status;
}
