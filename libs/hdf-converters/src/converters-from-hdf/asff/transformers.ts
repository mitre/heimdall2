import {createHash} from 'crypto';
import {
  ContextualizedControl,
  ContextualizedEvaluation,
  contextualizeEvaluation,
  convertFile,
  ExecJSON
} from 'inspecjs';
import _ from 'lodash';
import moment from 'moment';
import {version as HeimdallToolsVersion} from '../../../package.json';
import {getDescription} from '../../utils/global';
import {IFindingASFF, IOptions} from './asff-types';
import {
  FromHdfToAsffMapper,
  SegmentedControl,
  TO_ASFF_TYPES_SLASH_REPLACEMENT
} from './reverse-asff-mapper';

//FromHdfToAsff mapper transformers
type Counts = {
  Passed: number;
  PassedTests: number;
  Failed: number;
  FailedTests: number;
  PassingTestsFailedControl: number;
  NotApplicable: number;
  NotReviewed: number;
};

export function escapeForwardSlashes<T>(s: T): T {
  return _.isString(s) ? s.replace(/\//g, TO_ASFF_TYPES_SLASH_REPLACEMENT) as unknown as T : s;
}

export function getRunTime(hdf: ExecJSON.Execution): string {
  let time = new Date().toISOString();
  hdf.profiles.forEach((profile) => {
    if (
      profile.controls[0] &&
      profile.controls[0].results.length &&
      profile.controls[0].results[0].start_time
    ) {
      try {
        time = new Date(
          profile.controls[0].results[0].start_time
        ).toISOString();
      } catch {
        time = new Date().toISOString();
      }
    }
  });
  return time;
}

/** Trivial overlay filter that just takes the version of the control that has results from amongst all identical ids */
function filter_overlays(
  controls: ContextualizedControl[]
): ContextualizedControl[] {
  const idHash: {[key: string]: ContextualizedControl} = {};
  controls.forEach((c) => {
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
  });

  // Return the set of keys
  return Array.from(Object.values(idHash));
}

export function createProfileInfoFinding(
  hdf: ExecJSON.Execution,
  options: IOptions
): IFindingASFF {
  const runTime = getRunTime(hdf);
  const inspecJSJson = convertFile(JSON.stringify(hdf));
  const contextualizedEvaluation = contextualizeEvaluation(
    inspecJSJson['1_0_ExecJson'] as any
  );
  const counts = statusCount(contextualizedEvaluation);
  const updatedAt = new Date();
  updatedAt.setMilliseconds(
    updatedAt.getMilliseconds() +
      (contextualizedEvaluation.contains[0].contains.length || 0)
  );
  const profileInfo: Record<string, unknown> = {
    SchemaVersion: '2018-10-08',
    Id: `${options.target}/${hdf.profiles[0].name}`,
    ProductArn: `arn:aws:securityhub:${options.region}:${options.awsAccountId}:product/${options.awsAccountId}/default`,
    GeneratorId: `arn:aws:securityhub:us-east-2:${options.awsAccountId}:ruleset/set/${hdf.profiles[0].name}`,
    AwsAccountId: options.awsAccountId,
    CreatedAt: runTime,
    UpdatedAt: updatedAt,
    Title: `${options.target} | ${hdf.profiles[0].name} | ${moment().format(
      'YYYY-MM-DD hh:mm:ss [GMT]ZZ'
    )}`,
    Description: createDescription(counts),
    Severity: {
      Label: 'INFORMATIONAL'
    },
    FindingProviderFields: {
      Severity: {
        Label: 'INFORMATIONAL'
      },
      Types: createProfileInfoFindingFields(hdf, options)
    },
    Resources: [
      {
        Type: 'AwsAccount',
        Id: `AWS::::Account:${options.awsAccountId}`,
        Partition: 'aws',
        Region: options.region
      }
    ]
  };

  // need the intermediate caste to tell typescript that this cast is intentional
  return profileInfo as unknown as IFindingASFF;
}

export function statusCount(evaluation: ContextualizedEvaluation): Counts {
  let controls: ContextualizedControl[] = [];
  // Get all controls
  evaluation.contains.forEach((p) => controls.push(...p.contains));
  controls = filter_overlays(controls);
  const statusCounts: Counts = {
    Passed: 0,
    PassedTests: 0,
    PassingTestsFailedControl: 0,
    Failed: 0,
    FailedTests: 0,
    NotApplicable: 0,
    NotReviewed: 0
  };
  controls.forEach((control) => {
    if (control.hdf.status === 'Passed') {
      statusCounts.Passed += 1;
      statusCounts.PassedTests += (control.hdf.segments || []).length;
    } else if (control.hdf.status === 'Failed') {
      statusCounts.PassingTestsFailedControl += (
        control.hdf.segments || []
      ).filter((s) => s.status === 'passed').length;
      statusCounts.FailedTests += (control.hdf.segments || []).filter(
        (s) => s.status === 'failed'
      ).length;
      statusCounts.Failed += 1;
    } else if (control.hdf.status === 'Not Applicable') {
      statusCounts.NotApplicable += 1;
    } else if (control.hdf.status === 'Not Reviewed') {
      statusCounts.NotReviewed += 1;
    }
  });
  return statusCounts;
}

export function createDescription(counts: Counts): string {
  return `Passed: ${counts.Passed} (${
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
  segment: ExecJSON.ControlResult
): string {
  const segmentOverview = createNote(segment);
  const code = layersOfControl.map((layer) => createCode(layer)).join('\n\n');
  return `${code}\n\n${segmentOverview}`;
}

// Slices an array into chunks, since AWS doesn't allow uploading more than 100 findings at a time
export function sliceIntoChunks(arr: any[], chunkSize: number): any[][] {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
}

// Gets rid of extra spacing + newlines as these aren't shown in Security Hub
export function cleanText(text?: string | null): string | undefined {
  if (text) {
    return text.replace(/  +/g, ' ').replace(/\r?\n|\r/g, ' ');
  } else {
    return undefined;
  }
}

// Gets all layers of a control across overlaid profiles given the ID
export function getAllLayers(
  hdf: ExecJSON.Execution,
  knownControl: ExecJSON.Control
): (ExecJSON.Control & Record<string, unknown>)[] {
  if (hdf.profiles.length === 1) {
    return [
      {
        ...knownControl,
        profileInfo: {
          ..._.omit(hdf.profiles[0], 'controls')
        }
      }
    ];
  } else {
    const foundControls: (ExecJSON.Control & Record<string, unknown>)[] = [];
    // For each control in each profile
    hdf.profiles.forEach((profile) => {
      profile.controls.forEach((control) => {
        if (control.id === knownControl.id) {
          foundControls.push({
            ...control,
            profileInfo: {..._.omit(profile, 'controls')}
          });
        }
      });
    });
    return foundControls;
  }
}

// Creates Note field containing control status
export function createNote(segment: ExecJSON.ControlResult) {
  if (segment.message) {
    return `Test Description: ${segment.code_desc} --- Test Result: ${segment.message}`;
  } else if (segment.skip_message) {
    return `Test Description: ${segment.code_desc} --- Skip Message: ${segment.skip_message}`;
  } else {
    return `Test Description: ${segment.code_desc}`;
  }
}

function cleanObjectValues<T>(value: T): boolean {
  if (Array.isArray(value)) {
    return value.length < 0;
  }
  return !Boolean(value);
}

export function createCode(
  control: ExecJSON.Control & {profileInfo?: Record<string, unknown>}
) {
  return `=========================================================\n# Profile name: ${
    control.profileInfo?.name
  }\n=========================================================\n\n${
    control.code
      ? control.code?.replace(/\\\"/g, '"')
      : JSON.stringify(
          _.omitBy(
            _.omit(control, ['results', 'profileInfo']),
            cleanObjectValues
          )
        )
  }`;
}

export function setupId(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  const target = context?.ioptions.target;
  const name = context?.data.profiles[0].name;

  return `${target}/${name}/${control.id}/finding/${createHash('sha256')
    .update(control.id + control.result.code_desc)
    .digest('hex')}`;
}

export function setupProductARN(
  _val: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  return `arn:aws:securityhub:${context?.ioptions.region}:${context?.ioptions.awsAccountId}:product/${context?.ioptions.awsAccountId}/default`;
}

export function setupAwsAcct(
  _val: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  return context?.ioptions.awsAccountId;
}

export function setupCreated(control: SegmentedControl) {
  return control.result.start_time || new Date().toISOString();
}

export function setupRegion(
  _val: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  return context?.ioptions.region;
}
export function setupUpdated(
  _control: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  // Add one millisecond to the time by control index so the order is correct in security hub
  const time = new Date();
  time.setMilliseconds(time.getMilliseconds() + (context?.index || 0));
  return time.toISOString();
}

export function setupGeneratorId(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  return `arn:aws:securityhub:${context?.ioptions.region}:${context?.ioptions.awsAccountId}:ruleset/set/${context?.data.profiles[0].name}/rule/${control.id}`;
}

export function setupTitle(control: SegmentedControl) {
  const nistTags = control.tags.nist ? `[${control.tags.nist.join(', ')}]` : '';
  return _.truncate(
    `${control.id} | ${nistTags} | ${cleanText(control.title)}`,
    {length: 256}
  );
}

export function setupDescr(control: SegmentedControl) {
  // Check text can either be a description or a tag
  const checkText: string =
    getDescription(control.descriptions || [], 'check') ||
    (control.tags.check as string) ||
    'Check not available';

  const currentVal = _.truncate(
    cleanText(`${control.desc} -- Check Text: ${checkText}`),
    {length: 1024, omission: '[SEE FULL TEXT IN AssumeRolePolicyDocument]'}
  );

  const caveat = getDescription(control.descriptions || [], 'caveat');

  if (caveat) {
    return _.truncate(
      `Caveat: ${cleanText(caveat)} --- Description: ${currentVal}`,
      {length: 1024, omission: ''}
    );
  }
  return currentVal;
}

export function setupSevLabel(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  return context?.impactMapping.get(control.impact) || 'INFORMATIONAL';
}

export function setupSevOriginal(control: SegmentedControl) {
  return `${control.impact}`;
}

function createControlMetadata(control: SegmentedControl) {
  const types = [
    `Control/ID/${control.id}`,
    `Control/Impact/${control.impact}`
  ];
  if (control.desc) {
    types.push(`Control/Desc/${escapeForwardSlashes(control.desc)}`);
  }
  if (control.refs && control.refs.length > 0) {
    types.push(
      `Control/Refs/${escapeForwardSlashes(JSON.stringify(control.refs))}`
    );
  }
  if (
    control.source_location &&
    Object.keys(control.source_location).length > 0
  ) {
    types.push(
      `Control/Source_Location/${escapeForwardSlashes(
        JSON.stringify(control.source_location)
      )}`
    );
  }
  if (control.waiver_data && Object.keys(control.waiver_data).length > 0) {
    types.push(
      `Control/Waiver_Data/${escapeForwardSlashes(
        JSON.stringify(control.waiver_data)
      )}`
    );
  }
  if (control.title) {
    types.push(`Control/Title/${escapeForwardSlashes(control.title)}`);
  }
  return types;
}

function createProfileInfo(hdf?: ExecJSON.Execution): string[] {
  const typesArr: string[] = [];
  const targets = [
    'name',
    'version',
    'sha256',
    'title',
    'maintainer',
    'summary',
    'license',
    'copyright',
    'copyright_email'
  ];
  hdf?.profiles.forEach((layer) => {
    const profileInfos: Record<string, string>[] = [];
    targets.forEach((target) => {
      const value = _.get(layer, target);
      if (typeof value === 'string') {
        profileInfos.push({[target]: value});
      }
    });
    typesArr.push(
      `Profile/Info/${escapeForwardSlashes(JSON.stringify(profileInfos))}`
    );
  });
  return typesArr;
}

function getFilename(options?: IOptions): string {
  const slashSplit =
    options?.input.split('\\')[options?.input.split('\\').length - 1];
  return slashSplit?.split('/')[slashSplit.split('/').length - 1] ?? '';
}

function createProfileInfoFindingFields(
  hdf: ExecJSON.Execution,
  options: IOptions
): string[] {
  let typesArr = [
    `MITRE/SAF/${HeimdallToolsVersion}-hdf2asff`,
    `File/Input/${getFilename(options)}`
  ];
  const executionTargets = ['platform', 'statistics', 'version', 'passthrough'];
  executionTargets.forEach((target) => {
    const value = _.get(hdf, target);
    if (typeof value === 'string' && value.trim()) {
      typesArr.push(
        `Execution/${escapeForwardSlashes(target)}/${escapeForwardSlashes(
          value
        )}`
      );
    } else if (typeof value === 'object') {
      typesArr.push(
        `Execution/${escapeForwardSlashes(target)}/${escapeForwardSlashes(
          JSON.stringify(value)
        )}`
      );
    }
  });
  hdf.profiles.forEach((profile) => {
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
      'status_message'
    ];
    targets.forEach((target) => {
      const value = _.get(profile, target);
      if (typeof value === 'string') {
        typesArr.push(
          `${escapeForwardSlashes(profile.name)}/${escapeForwardSlashes(
            target
          )}/${escapeForwardSlashes(value)}`
        );
      } else if (typeof value === 'object') {
        typesArr.push(
          `${escapeForwardSlashes(profile.name)}/${escapeForwardSlashes(
            target
          )}/${escapeForwardSlashes(JSON.stringify(value))}`
        );
      }
    });
  });
  typesArr = typesArr.slice(0, 50);
  return typesArr;
}

function createSegmentInfo(segment: ExecJSON.ControlResult): string[] {
  const typesArr: string[] = [];
  const targets = [
    'code_desc',
    'exception',
    'message',
    'resource',
    'run_time',
    'start_time',
    'skip_message',
    'status'
  ];
  targets.forEach((target) => {
    if (_.has(segment, target) && _.get(segment, target) !== undefined) {
      typesArr.push(
        `Segment/${escapeForwardSlashes(target)}/${escapeForwardSlashes(
          _.get(segment, target)
        )}`
      );
    }
  });
  return typesArr;
}

function createTagInfo(control: {tags: Record<string, unknown>}): string[] {
  const typesArr: string[] = [];
  for (const tag in control.tags) {
    typesArr.push(
      `Tags/${escapeForwardSlashes(tag)}/${escapeForwardSlashes(
        JSON.stringify(control.tags[tag])
      )}`
    );
  }
  return typesArr;
}

function createDescriptionInfo(control: ExecJSON.Control): string[] {
  const typesArr: string[] = [];
  if (Array.isArray(control.descriptions)) {
    control.descriptions?.forEach((description) => {
      typesArr.push(
        `Descriptions/${escapeForwardSlashes(
          description.label
        )}/${escapeForwardSlashes(cleanText(description.data) || 'No Value')}`
      );
    });
  } else {
    Object.entries(control.descriptions || {}).forEach(([key, value]) => {
      typesArr.push(
        `Descriptions/${escapeForwardSlashes(key)}/${escapeForwardSlashes(
          cleanText(value as string) || 'No Value'
        )}`
      );
    });
  }

  return typesArr;
}

export function setupFindingType(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  const typesArr = [
    `MITRE/SAF/${HeimdallToolsVersion}-hdf2asff`,
    `File/Input/${getFilename(context?.ioptions)}`,
    `Control/Code/${escapeForwardSlashes(
      control.layersOfControl
        .map(
          (layer: ExecJSON.Control & {profileInfo?: Record<string, unknown>}) =>
            createCode(layer)
        )
        .join('\n\n')
    )}`
  ];

  // Add control metadata to the Finding Provider Fields
  typesArr.push(...createControlMetadata(control));
  // Add all layers of profile info to the Finding Provider Fields
  typesArr.push(...createProfileInfo(context?.data));
  // Add segment/result information to Finding Provider Fields
  typesArr.push(...createSegmentInfo(control.result));
  // Add Tags to Finding Provider Fields
  typesArr.push(...createTagInfo(control));
  // Add Descriptions to FindingProviderFields
  typesArr.push(...createDescriptionInfo(control));

  return typesArr;
}

export function getFixForControl(control: SegmentedControl) {
  return (
    getDescription(control.descriptions || [], 'fix') ||
    control.tags.fix ||
    'Fix not available'
  );
}

export function setupRemRec(control: SegmentedControl) {
  return _.truncate(
    cleanText(
      `${createNote(control.result)} --- Fix: ${getFixForControl(control)}`
    ),
    {length: 512, omission: '... [SEE FULL TEXT IN AssumeRolePolicyDocument]'}
  );
}

export function setupProdFieldCheck(control: SegmentedControl) {
  const checkText: string =
    getDescription(control.descriptions || [], 'check') ||
    (control.tags.check as string) ||
    'Check not available';

  return _.truncate(checkText, {length: 2048, omission: ''});
}

export function setupResourcesID(
  _val: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  return `AWS::::Account:${context?.ioptions.awsAccountId}`;
}

export function setupResourcesID2(control: SegmentedControl) {
  return `${control.id} Validation Code`;
}

export function setupDetailsAssume(control: SegmentedControl) {
  return createAssumeRolePolicyDocument(
    control.layersOfControl,
    control.result
  );
}

export function setupControlStatus(control: SegmentedControl) {
  const status: string | boolean =
    control.result.status === 'skipped'
      ? 'WARNING'
      : control.result.status === 'passed';
  if (typeof status === 'boolean') {
    return status ? 'PASSED' : 'FAILED';
  }
  return status;
}
