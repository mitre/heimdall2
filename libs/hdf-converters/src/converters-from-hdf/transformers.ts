import {createHash} from 'crypto';
import {
  ContextualizedControl,
  ContextualizedEvaluation,
  ExecJSON
} from 'inspecjs';
import _ from 'lodash';
import {FlattenedExecJSON} from './from-hdf-base-converter';
import {FromHdfToAsffMapper} from './from-hdf-to-asff-mapper';

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
  layersOfControl: (ExecJSON.Control & {
    profileInfo?: Record<string, unknown>;
  })[],
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
): (ExecJSON.Control & {
  fix?: string;
  profileInfo?: Record<string, unknown>;
})[] {
  if (hdf.profiles.length === 1) {
    return [{...knownControl, ..._.omit(hdf.profiles, 'controls')}];
  } else {
    const foundControls: (ExecJSON.Control & {
      profileInfo?: Record<string, unknown>;
    })[] = [];
    // For each control in each profile
    hdf.profiles.forEach((profile) => {
      profile.controls.forEach((control) => {
        if (control.id === knownControl.id) {
          foundControls.push({
            ...control,
            profileInfo: _.omit(profile, 'controls')
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
  hdfData: FlattenedExecJSON,
  context?: FromHdfToAsffMapper
) {
  const target = context?.ioptions.target.toLowerCase().trim();
  const control = hdfData.controls;
  const segment = hdfData.results;
  const name = hdfData.name;

  return `${target}/${name}/${control.id}/finding/${createHash('sha256')
    .update(control.id + segment.code_desc)
    .digest('hex')}`;
}

export function setupProductARN(
  _val: FlattenedExecJSON,
  context?: FromHdfToAsffMapper
) {
  return `arn:aws:securityhub:${context?.ioptions.region}:${context?.ioptions.awsAccountId}:product/${context?.ioptions.awsAccountId}/default`;
}

export function setupAwsAcct(
  _val: FlattenedExecJSON,
  context?: FromHdfToAsffMapper
) {
  return context?.ioptions.awsAccountId;
}

export function setupCreated(hdfData: FlattenedExecJSON) {
  return (hdfData || {start_time: new Date().toISOString()}).start_time;
}

export function setupRegion(
  _val: FlattenedExecJSON,
  context?: FromHdfToAsffMapper
) {
  return context?.ioptions.region;
}
export function setupUpdated() {
  return new Date().toISOString();
}

export function setupGeneratorId(
  hdfData: FlattenedExecJSON,
  context?: FromHdfToAsffMapper
) {
  const control = hdfData.controls;
  const name = hdfData.name;

  return `arn:aws:securityhub:us-east-2:${context?.ioptions.awsAccountId}:ruleset/set/${name}/rule/${control.id}`;
}

export function setupTitle(hdfData: FlattenedExecJSON) {
  const control = hdfData.controls;
  const layerOfControl = hdfData.layersOfControl[0];
  const nistTags = layerOfControl.tags.nist
    ? `[${_.get(layerOfControl, 'tags.nist').join(', ')}]`
    : '';
  return _.truncate(
    `${control.id} | ${nistTags} | ${cleanText(layerOfControl.title)}`,
    {length: 256}
  );
}

export function setupDescr(hdfData: FlattenedExecJSON) {
  const layerOfControl = hdfData.layersOfControl[0];
  // Check text can either be a description or a tag
  const checktext: string =
    layerOfControl.descriptions?.find(
      (description: {label: string}) => description.label === 'check'
    )?.data ||
    (layerOfControl.tags['check'] as string) ||
    'Check not available';

  const currentVal = _.truncate(
    cleanText(`${layerOfControl.desc} -- Check Text: ${checktext}`),
    {length: 1024, omission: '[SEE FULL TEXT IN AssumeRolePolicyDocument]'}
  );

  const caveat = layerOfControl.descriptions?.find(
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
  hdfData: FlattenedExecJSON,
  context?: FromHdfToAsffMapper
) {
  const layerOfControl = hdfData.layersOfControl[0];

  return context?.impactMapping.get(layerOfControl.impact) || 'INFORMATIONAL';
}

export function setupSevOriginal(hdfData: FlattenedExecJSON) {
  return `${hdfData.layersOfControl[0].impact}`;
}

function createProfileInfo(
  layersOfControl: Record<string, unknown>[]
): string[] {
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
  layersOfControl.forEach((layer) => {
    const profileInfos: Record<string, string>[] = [];
    targets.forEach((target) => {
      const value = _.get(layer.profileInfo, target);
      if (typeof value === 'string') {
        profileInfos.push({[target]: value});
      }
    });
    typesArr.push(
      `Profile/Info/${JSON.stringify(profileInfos).replace(/\//g, '∕')}`
    );
  });
  return typesArr;
}

function createSegmentInfo(segment: unknown): string[] {
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
      typesArr.push(`Segment/${target}/${value.replace(/\//g, '∕')}`);
    }
  });
  return typesArr;
}

function createTagInfo(control: {tags: Record<string, unknown>}): string[] {
  const typesArr: string[] = [];
  for (const tag in control.tags) {
    if (control) {
      if (tag === 'nist' && Array.isArray(control.tags.nist)) {
        typesArr.push(`Tags/nist/${control.tags.nist.join(', ')}`);
      } else if (tag === 'cci' && Array.isArray(control.tags.cci)) {
        typesArr.push(`Tags/cci/${control.tags.cci.join(', ')}`);
      } else if (typeof control.tags[tag] === 'string') {
        typesArr.push(
          `Tags/${tag.replace(/\//g, '∕')}/${(
            control.tags[tag] as string
          ).replace(/\//g, '∕')}`
        );
      } else if (
        typeof control.tags[tag] === 'object' &&
        Array.isArray(control.tags[tag])
      ) {
        typesArr.push(
          `Tags/${tag.replace(/\//g, '∕')}/${(
            control.tags[tag] as Array<string>
          )
            .join(', ')
            .replace(/\//g, '∕')}`
        );
      }
    }
  }
  return typesArr;
}

function createDescriptionInfo(control: {
  descriptions: {
    data: string;
    label: string;
  }[];
}): string[] {
  const typesArr: string[] = [];
  control.descriptions.forEach((description) => {
    typesArr.push(
      `Descriptions/${description.label.replace(/\//g, '∕')}/${cleanText(
        description.data
      )?.replace(/\//g, '∕')}`
    );
  });
  return typesArr;
}

export function setupFindingType(
  hdfData: FlattenedExecJSON,
  context?: FromHdfToAsffMapper
) {
  const slashSplit =
    context?.ioptions.input.split('\\')[
      context?.ioptions.input.split('\\').length - 1
    ];
  const filename = slashSplit?.split('/')[slashSplit.split('/').length - 1];

  const typesArr = [
    `File/Input/${filename}`,
    `Control/Code/${hdfData.layersOfControl
      .map(
        (layer: ExecJSON.Control & {profileInfo?: Record<string, unknown>}) =>
          createCode(layer)
      )
      .join('\n\n')
      .replace(/\//g, '∕')}`
  ];

  const layersOfControl = hdfData.layersOfControl;
  const segment = hdfData.results;

  // Add all layers of profile info to the Finding Provider Fields
  typesArr.push(...createProfileInfo(layersOfControl));
  // Add segment/result information to Finding Provider Fields
  typesArr.push(...createSegmentInfo(segment));
  // Add Tags to Finding Provider Fields
  typesArr.push(...createTagInfo(layersOfControl[0]));
  // Add Descriptions to FindingProviderFields
  typesArr.push(...createDescriptionInfo(layersOfControl[0]));

  return typesArr;
}

export function setupRemRec(hdfData: FlattenedExecJSON) {
  const segment = hdfData.results;
  const layerOfControl = hdfData.layersOfControl[0];

  const getFix = (control: ExecJSON.Control) =>
    control.descriptions?.find(
      (description: {label: string}) => description.label === 'fix'
    )?.data ||
    control.tags.fix ||
    'Fix not available';

  return _.truncate(
    cleanText(`${createNote(segment)} --- Fix: ${getFix(layerOfControl)}`),
    {length: 512, omission: '... [SEE FULL TEXT IN AssumeRolePolicyDocument]'}
  );
}

export function setupProdFieldCheck(hdfData: FlattenedExecJSON) {
  const layerOfControl = hdfData.layersOfControl[0];
  const checktext: string =
    layerOfControl.descriptions?.find(
      (description: {label: string}) => description.label === 'check'
    )?.data ||
    (layerOfControl.tags['check'] as string) ||
    'Check not available';

  return _.truncate(checktext, {length: 2048, omission: ''});
}

export function setupResourcesID(
  _val: FlattenedExecJSON,
  context?: FromHdfToAsffMapper
) {
  return `AWS::::Account:${context?.ioptions.awsAccountId}`;
}

export function setupResourcesID2(hdfData: FlattenedExecJSON) {
  return `${hdfData.layersOfControl[0].id} Validation Code`;
}

export function setupDetailsAssume(hdfData: FlattenedExecJSON) {
  return createAssumeRolePolicyDocument(
    hdfData.layersOfControl,
    hdfData.results
  );
}

export function setupControlStatus(hdfData: FlattenedExecJSON) {
  const segment = hdfData.results;

  const status: string | boolean =
    segment.status === 'skipped' ? 'WARNING' : segment.status === 'passed';
  if (typeof status === 'boolean') {
    return status ? 'PASSED' : 'FAILED';
  }
  return status;
}
