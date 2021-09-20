/** Implementation for the "base" 1.0 inspec output schema
 * A lot of information/behaviour is shared between the profile and result version so we use a single abstract superclass
 */

import {
  ControlStatus,
  HDFControl,
  HDFControlSegment,
  SegmentStatus,
  Severity
} from '../compat_wrappers';
import {
  ControlResult as ControlResult_1_0,
  ExecJSONControl as ResultControl_1_0
} from '../generated_parsers/v_1_0/exec-json';
import {ProfileJSONControl as ProfileControl_1_0} from '../generated_parsers/v_1_0/profile-json';
import {
  CanonizationConfig,
  is_control,
  NistControl,
  NistRevision,
  parse_nist
} from '../nist';

const profileError = 'Profile Error';

abstract class HDFControl10 implements HDFControl {
  // Declare all properties expected
  readonly rawNistTags: string[];
  readonly parsedNistTags: NistControl[];
  readonly parsedNistRevision: NistRevision | null;
  readonly severity: Severity;
  readonly waived: boolean;
  readonly descriptions: {[key: string]: string} = {};
  readonly isProfile: boolean;

  // We use this as a reference
  wraps: ResultControl_1_0 | ProfileControl_1_0;

  // We ask that the child compute waived for us, to ease discrimination thereof
  constructor(
    forControl: ResultControl_1_0 | ProfileControl_1_0,
    isProfile: boolean,
    waived: boolean
  ) {
    this.wraps = forControl;
    this.waived = waived;
    this.isProfile = isProfile;

    this.rawNistTags = HDFControl10.compute_raw_nist_tags(this.wraps);
    const tmp = HDFControl10.compute_proper_nist_tags(this.rawNistTags);
    this.parsedNistTags = tmp[0];
    this.parsedNistRevision = tmp[1];
    this.severity = HDFControl10.compute_severity(this.wraps);
  }

  // Abstracts - implemented more specifically below
  abstract get message(): string;
  abstract get segments(): HDFControlSegment[] | undefined;
  abstract get status(): ControlStatus;

  // We leave this as a getter because its computation is trivial, and saving it would result in vast data duplication
  get finding_details(): string {
    switch (this.status) {
      case 'Failed':
        return `One or more of the automated tests failed or was inconclusive for the control:\n\n${this.message}\n`;
      case 'Passed':
        return `All Automated tests passed for the control:\n\n${this.message}\n`;
      case 'Not Reviewed':
        return `Automated test skipped due to known accepted condition in the control:\n\n${this.message}\n`;
      case 'Not Applicable':
        return `Justification:\n\n${this.message}\n`;
      case profileError:
        if (!this.status_list || this.status_list.length === 0) {
          return 'No describe blocks were run in this control';
        } else if (this.message !== undefined) {
          return `Exception:\n\n${this.message}\n`;
        } else {
          return `No details available for this control.`;
        }
      case 'From Profile':
        return 'No tests are run in a profile json.';
      default:
        throw new Error('Error: invalid status generated');
    }
  }

  // Also leave this as a getter because it's trivial and there's no sense duplicating this data
  get status_list(): SegmentStatus[] | undefined {
    if (this.segments !== undefined) {
      return this.segments.map((s) => s.status);
    }
  }

  // Everything below here are helpers for computing our properties

  private static compute_raw_nist_tags(
    raw: ResultControl_1_0 | ProfileControl_1_0
  ): string[] {
    const fetched: string[] | undefined | null = raw.tags['nist'];
    if (!fetched) {
      return ['UM-1'];
    } else {
      return fetched;
    }
  }

  /** Generates the nist tags, as needed. */
  private static compute_proper_nist_tags(
    raw: string[]
  ): [NistControl[], NistRevision | null] {
    // Initialize
    let parsedNistTags: NistControl[] = [];
    let parsedNistRevision: NistRevision | null = null;
    const seenSpecs = new Set<string>(); // Used to track duplication

    // Process item by item
    raw.map(parse_nist).forEach((x) => {
      if (!x) {
        return;
      } else if (is_control(x)) {
        const specChain = x.subSpecifiers.join('-');
        if (!seenSpecs.has(specChain)) {
          seenSpecs.add(specChain);
          parsedNistTags.push(x);
        }
      } else {
        parsedNistRevision = x;
      }
    });

    // Sort the tags
    parsedNistTags = parsedNistTags.sort((a, b) => a.localCompare(b));

    // Stub if necessary
    if (parsedNistTags.length === 0) {
      parsedNistTags.push(parse_nist('UM-1') as NistControl);
    }

    return [parsedNistTags, parsedNistRevision];
  }

  canonized_nist(config: CanonizationConfig): string[] {
    const result: string[] = [];
    for (const v of this.parsedNistTags) {
      const s = v.canonize(config);
      if (!result.includes(s)) {
        result.push(s);
      }
    }
    return result;
  }

  private static compute_severity(
    raw: ResultControl_1_0 | ProfileControl_1_0
  ): Severity {
    if (raw.impact < 0.1) {
      return 'none';
    } else if (raw.impact < 0.4) {
      return 'low';
    } else if (raw.impact < 0.7) {
      return 'medium';
    } else if (raw.impact < 0.9) {
      return 'high';
    } else {
      return 'critical';
    }
  }
}

export class ExecControl extends HDFControl10 implements HDFControl {
  // Store message - it duplicates data but is very expensive to make,
  // and in general we can afford ram more than anything else
  readonly message: string;
  readonly segments: HDFControlSegment[];
  readonly status: ControlStatus;

  constructor(control: ResultControl_1_0) {
    // Waived is true iff waived_data is present and skipped_due_to_waiver is true
    super(
      control,
      false,
      !!(control.waiver_data && control.waiver_data.skipped_due_to_waiver)
    );

    // Build descriptions
    if (control.descriptions) {
      control.descriptions.forEach(
        (x) => (this.descriptions[x.label] = x.data)
      );
    }

    // Build message
    this.message = ExecControl.compute_message(control);

    // Build segments
    this.segments = ExecControl.compute_segments(control);

    // Build status (using segments! Must be after that!!)
    this.status = this.compute_status();
  }

  get start_time(): string | undefined {
    if (this.segments && this.segments.length) {
      return this.segments[0].start_time;
    }
    return undefined;
  }

  private static compute_message(control: ResultControl_1_0): string {
    if (control.impact !== 0) {
      // If it has any impact, convert each result to a message line and chain them all together
      return control.results.map(ExecControl.to_message_line).join('');
    } else {
      // If it's no impact, just post the description (if it exists)
      return control.desc || 'No message found.';
    }
  }

  // I didn't make this one static because, frankly, it was annoying and unnecessary
  // Just do it last
  private compute_status(): ControlStatus {
    if (!this.status_list || this.status_list.includes('error')) {
      return profileError;
    } else if (this.waived || this.wraps.impact === 0) {
      // We interject this between profile error conditions because an empty-result waived control is still NA
      return 'Not Applicable';
    } else if (this.status_list.length === 0) {
      return profileError;
    } else if (this.status_list.includes('failed')) {
      return 'Failed';
    } else if (this.status_list.includes('passed')) {
      return 'Passed';
    } else if (this.status_list.includes('skipped')) {
      return 'Not Reviewed';
    } else {
      return profileError; // Shouldn't get here, but might as well have fallback
    }
  }

  private static to_message_line(r: ControlResult_1_0): string {
    switch (r.status) {
      case 'skipped':
        return `SKIPPED -- ${r.skip_message}\n`;
      case 'failed':
        return `FAILED -- Test: ${r.code_desc}\nMessage: ${r.message}\n`;
      case 'passed':
        return `PASSED -- ${r.code_desc}\n"`;
      case 'error':
        return `ERROR -- Test: ${r.code_desc}\nMessage: ${r.message}`;
      default:
        return `Exception: ${r.exception}\n`;
    }
  }

  private static compute_segments(
    control: ResultControl_1_0
  ): HDFControlSegment[] {
    return control.results.map((result) => {
      // Set status to error if backtrace is not found. Also, default no_status
      const status: SegmentStatus = result.backtrace
        ? 'error'
        : result.status || 'no_status';
      return {
        status: status,
        message: result.message || undefined,
        code_desc: result.code_desc,
        skip_message: result.skip_message || undefined,
        exception: result.exception || undefined,
        backtrace: result.backtrace || undefined,
        start_time: result.start_time,
        run_time: result.run_time || undefined,
        resource: result.resource || undefined
      };
    });
  }
}

export class ProfileControl extends HDFControl10 implements HDFControl {
  // Establish our data
  readonly segments = undefined;
  readonly status = 'From Profile';

  constructor(control: ProfileControl_1_0) {
    super(control, true, false);
    // Build descriptions
    if (control.descriptions) {
      for (const key of Object.keys(control.descriptions)) {
        if (typeof control.descriptions[key] === 'string') {
          this.descriptions[key] = control.descriptions[key];
        }
      }
    }
  }

  // Helper to save us having to do (this.wraps as ProfileControl) everywehre. We know the type
  private get typed_wrap(): ProfileControl_1_0 {
    return this.wraps as ProfileControl_1_0;
  }

  get message(): string {
    // If it's no impact, just post the description (if it exists)
    return this.typed_wrap.desc || 'No message found.';
  }
}
