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

export function getRunTime(hdf: ExecJSON.Execution): Date {
  let time = new Date();
  hdf.profiles.forEach((profile) => {
    if (
      profile.controls[0].results.length &&
      profile.controls[0].results[0].start_time
    ) {
      time = new Date(profile.controls[0].results[0].start_time);
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
    CreatedAt: runTime.toISOString(),
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
      Types: createProfileInfoFindingFields(hdf)
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

// Gets all layers of a control accross overlaid profiles given the ID
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

export function createCode(
  control: ExecJSON.Control & {profileInfo?: Record<string, unknown>}
) {
  return `=========================================================\n# Profile name: ${
    control.profileInfo?.name
  }\n=========================================================\n\n${control.code?.replace(
    /\\\"/g,
    '"'
  )}`;
}

export function setupId(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  const target = context?.ioptions.target.toLowerCase().trim();
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
  const checktext: string =
    control.descriptions?.find(
      (description: {label: string}) => description.label === 'check'
    )?.data ||
    (control.tags['check'] as string) ||
    'Check not available';

  const currentVal = _.truncate(
    cleanText(`${control.desc} -- Check Text: ${checktext}`),
    {length: 1024, omission: '[SEE FULL TEXT IN AssumeRolePolicyDocument]'}
  );

  const caveat = control.descriptions?.find(
    (description: {label: string}) => description.label === 'caveat'
  )?.data;

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
      `Profile/Info/${JSON.stringify(profileInfos).replace(
        /\//g,
        TO_ASFF_TYPES_SLASH_REPLACEMENT
      )}`
    );
  });
  return typesArr;
}

function createProfileInfoFindingFields(hdf: ExecJSON.Execution): string[] {
  let typesArr: string[] = [];
  hdf.profiles.forEach((profile) => {
    const targets = [
      'version',
      'sha256',
      'maintainer',
      'summary',
      'license',
      'copyright',
      'copyright_email'
    ];
    targets.forEach((target) => {
      const value = _.get(profile, target);
      if (typeof value === 'string') {
        typesArr.push(`${profile.name}/${target}/${value}`);
      }
    });
    const inputs: Record<string, unknown>[] = [];
    profile.attributes.forEach((input) => {
      if (input.options.value) {
        inputs.push({[input.name]: input.options.value});
      }
    });
    typesArr.push(
      `${profile.name}/inputs/${JSON.stringify(inputs).replace(
        /\//g,
        TO_ASFF_TYPES_SLASH_REPLACEMENT
      )}`
    );
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
    const value = _.get(segment, target);
    if (typeof value === 'string' && value) {
      typesArr.push(
        `Segment/${target}/${value.replace(
          /\//g,
          TO_ASFF_TYPES_SLASH_REPLACEMENT
        )}`
      );
    }
  });
  return typesArr;
}

function createTagInfo(control: {tags: Record<string, unknown>}): string[] {
  const typesArr: string[] = [];
  for (const tag in control.tags) {
    if (control) {
      if (
        tag === 'nist' &&
        Array.isArray(control.tags.nist) &&
        control.tags.nist.length > 0
      ) {
        typesArr.push(`Tags/nist/${control.tags.nist.join(', ')}`);
      } else if (
        tag === 'cci' &&
        Array.isArray(control.tags.cci) &&
        control.tags.cci.length > 0
      ) {
        typesArr.push(`Tags/cci/${control.tags.cci.join(', ')}`);
      } else if (typeof control.tags[tag] === 'string') {
        typesArr.push(
          `Tags/${tag.replace(/\//g, TO_ASFF_TYPES_SLASH_REPLACEMENT)}/${(
            control.tags[tag] as string
          ).replace(/\//g, TO_ASFF_TYPES_SLASH_REPLACEMENT)}`
        );
      } else if (
        typeof control.tags[tag] === 'object' &&
        Array.isArray(control.tags[tag]) &&
        (control.tags[tag] as Array<string>).length > 0
      ) {
        typesArr.push(
          `Tags/${tag.replace(/\//g, TO_ASFF_TYPES_SLASH_REPLACEMENT)}/${(
            control.tags[tag] as Array<string>
          )
            .join(', ')
            .replace(/\//g, TO_ASFF_TYPES_SLASH_REPLACEMENT)}`
        );
      }
    }
  }
  return typesArr;
}

function createDescriptionInfo(control: ExecJSON.Control): string[] {
  const typesArr: string[] = [];
  control.descriptions?.forEach((description) => {
    typesArr.push(
      `Descriptions/${description.label.replace(
        /\//g,
        TO_ASFF_TYPES_SLASH_REPLACEMENT
      )}/${cleanText(description.data)?.replace(
        /\//g,
        TO_ASFF_TYPES_SLASH_REPLACEMENT
      )}`
    );
  });
  return typesArr;
}

export function setupFindingType(
  control: SegmentedControl,
  context?: FromHdfToAsffMapper
) {
  const slashSplit =
    context?.ioptions.input.split('\\')[
      context?.ioptions.input.split('\\').length - 1
    ];
  const filename = slashSplit?.split('/')[slashSplit.split('/').length - 1];

  const typesArr = [
    `File/Input/${filename}`,
    `Control/Code/${control.layersOfControl
      .map(
        (layer: ExecJSON.Control & {profileInfo?: Record<string, unknown>}) =>
          createCode(layer)
      )
      .join('\n\n')
      .replace(/\//g, TO_ASFF_TYPES_SLASH_REPLACEMENT)}`
  ];

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
    control.descriptions?.find(
      (description: {label: string}) => description.label === 'fix'
    )?.data ||
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
  const checktext: string =
    control.descriptions?.find(
      (description: {label: string}) => description.label === 'check'
    )?.data ||
    (control.tags['check'] as string) ||
    'Check not available';

  return _.truncate(checktext, {length: 2048, omission: ''});
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
