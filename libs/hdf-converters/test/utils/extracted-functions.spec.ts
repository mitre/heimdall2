import { ExecJSON } from 'inspecjs';
import { describe, expect, it } from 'vitest';
import { buildSkipResult } from '../../src/aws-config-mapper';
import { accumulateControlStatus, type Counts } from '../../src/converters-from-hdf/asff/transformers';
import { countResultSeverity, countResultStatus } from '../../src/converters-from-hdf/html/reverse-html-mapper';
import { findControlAcrossProfiles } from '../../src/utils/description-editing';

function makeControl(id: string, title = ''): ExecJSON.Control {
  return {
    code: '',
    desc: '',
    descriptions: [],
    id,
    impact: 0.5,
    refs: [],
    results: [],
    source_location: {},
    tags: {},
    title,
  };
}

function makeProfile(controls: ExecJSON.Control[]): ExecJSON.Profile {
  return {
    attributes: [],
    controls,
    depends: [],
    groups: [],
    name: 'test-profile',
    sha256: '',
    supports: [],
  };
}

function makeHdfControl(status: string, severity: string, segments: { status: string }[] = []) {
  return {
    root: {
      hdf: {
        segments: segments.map(s => ({ ...s })),
        severity,
        status,
      },
    },
  } as any;
}

function makeAsffControl(status: string, segments: { status: string }[] = []) {
  return {
    hdf: {
      segments: segments.map(s => ({ ...s })),
      status,
    },
  } as any;
}

describe('findControlAcrossProfiles', () => {
  const controlA = makeControl('V-12345', 'Control A');
  const controlB = makeControl('V-67890', 'Control B');
  const profile1 = makeProfile([controlA]);
  const profile2 = makeProfile([controlB]);

  it('finds a control in the first profile', () => {
    expect(findControlAcrossProfiles([profile1, profile2], 'V-12345')).toBe(controlA);
  });

  it('finds a control in the second profile', () => {
    expect(findControlAcrossProfiles([profile1, profile2], 'V-67890')).toBe(controlB);
  });

  it('returns undefined when control is not in any profile', () => {
    expect(findControlAcrossProfiles([profile1, profile2], 'V-99999')).toBeUndefined();
  });

  it('matches case-insensitively', () => {
    expect(findControlAcrossProfiles([profile1], 'v-12345')).toBe(controlA);
  });

  it('returns undefined for empty profiles array', () => {
    expect(findControlAcrossProfiles([], 'V-12345')).toBeUndefined();
  });
});

describe('countResultStatus', () => {
  it('counts Failed with segment breakdown', () => {
    const result = makeHdfControl('Failed', 'medium', [
      { status: 'passed' },
      { status: 'failed' },
      { status: 'failed' },
    ]);
    const counts = countResultStatus(result);
    expect(counts.failed).toBe(1);
    expect(counts.passingTestsFailedResult).toBe(1);
    expect(counts.failedTests).toBe(2);
  });

  it('counts Not Applicable', () => {
    const counts = countResultStatus(makeHdfControl('Not Applicable', 'medium'));
    expect(counts.notApplicable).toBe(1);
    expect(counts.failed).toBe(0);
  });

  it('counts Not Reviewed', () => {
    const counts = countResultStatus(makeHdfControl('Not Reviewed', 'medium'));
    expect(counts.notReviewed).toBe(1);
  });

  it('counts Passed with segment count', () => {
    const result = makeHdfControl('Passed', 'medium', [
      { status: 'passed' },
      { status: 'passed' },
    ]);
    const counts = countResultStatus(result);
    expect(counts.passed).toBe(1);
    expect(counts.passedTests).toBe(2);
  });

  it('counts Profile Error', () => {
    const counts = countResultStatus(makeHdfControl('Profile Error', 'medium'));
    expect(counts.profileError).toBe(1);
  });

  it('returns all zeros for unknown status', () => {
    const counts = countResultStatus(makeHdfControl('Unknown', 'medium'));
    expect(counts.failed).toBe(0);
    expect(counts.passed).toBe(0);
    expect(counts.notApplicable).toBe(0);
    expect(counts.notReviewed).toBe(0);
    expect(counts.profileError).toBe(0);
  });
});

describe('countResultSeverity', () => {
  it('counts high', () => {
    expect(countResultSeverity(makeHdfControl('Passed', 'high')).high).toBe(1);
  });

  it('counts low', () => {
    expect(countResultSeverity(makeHdfControl('Passed', 'low')).low).toBe(1);
  });

  it('counts medium', () => {
    expect(countResultSeverity(makeHdfControl('Passed', 'medium')).medium).toBe(1);
  });

  it('counts none', () => {
    expect(countResultSeverity(makeHdfControl('Passed', 'none')).none).toBe(1);
  });

  it('counts critical', () => {
    expect(countResultSeverity(makeHdfControl('Passed', 'critical')).critical).toBe(1);
  });

  it('returns all zeros for unknown severity', () => {
    const counts = countResultSeverity(makeHdfControl('Passed', 'unknown'));
    expect(counts.high).toBe(0);
    expect(counts.low).toBe(0);
    expect(counts.medium).toBe(0);
    expect(counts.none).toBe(0);
    expect(counts.critical).toBe(0);
  });
});

function zeroCounts(): Counts {
  return {
    Failed: 0,
    FailedTests: 0,
    NotApplicable: 0,
    NotReviewed: 0,
      Passed: 0,
      PassedTests: 0,
      PassingTestsFailedControl: 0,
    };
}

describe('accumulateControlStatus', () => {
  it('accumulates Failed with segment counts', () => {
    const counts = zeroCounts();
    accumulateControlStatus(counts, makeAsffControl('Failed', [
      { status: 'passed' },
      { status: 'failed' },
      { status: 'failed' },
    ]));
    expect(counts.Failed).toBe(1);
    expect(counts.PassingTestsFailedControl).toBe(1);
    expect(counts.FailedTests).toBe(2);
  });

  it('accumulates Not Applicable', () => {
    const counts = zeroCounts();
    accumulateControlStatus(counts, makeAsffControl('Not Applicable'));
    expect(counts.NotApplicable).toBe(1);
  });

  it('accumulates Not Reviewed', () => {
    const counts = zeroCounts();
    accumulateControlStatus(counts, makeAsffControl('Not Reviewed'));
    expect(counts.NotReviewed).toBe(1);
  });

  it('accumulates Passed with segment count', () => {
    const counts = zeroCounts();
    accumulateControlStatus(counts, makeAsffControl('Passed', [
      { status: 'passed' },
      { status: 'passed' },
      { status: 'passed' },
    ]));
    expect(counts.Passed).toBe(1);
    expect(counts.PassedTests).toBe(3);
  });

  it('accumulates multiple controls', () => {
    const counts = zeroCounts();
    accumulateControlStatus(counts, makeAsffControl('Failed', [{ status: 'failed' }]));
    accumulateControlStatus(counts, makeAsffControl('Passed', [{ status: 'passed' }]));
    accumulateControlStatus(counts, makeAsffControl('Not Applicable'));
    expect(counts.Failed).toBe(1);
    expect(counts.Passed).toBe(1);
    expect(counts.NotApplicable).toBe(1);
  });

  it('does not modify counts for unknown status', () => {
    const counts = zeroCounts();
    accumulateControlStatus(counts, makeAsffControl('Unknown'));
    expect(counts).toEqual(zeroCounts());
  });
});

describe('buildSkipResult', () => {
  it('returns Skipped result for NOT_APPLICABLE', () => {
    const result = buildSkipResult('NOT_APPLICABLE');
    expect(result).toBeDefined();
    expect(result?.status).toBe(ExecJSON.ControlResultStatus.Skipped);
    expect(result?.code_desc).toContain('No AWS resources found');
  });

  it('returns Skipped result for INSUFFICIENT_DATA', () => {
    const result = buildSkipResult('INSUFFICIENT_DATA');
    expect(result).toBeDefined();
    expect(result?.status).toBe(ExecJSON.ControlResultStatus.Skipped);
    expect(result?.code_desc).toContain('Not enough data');
  });

  it('returns undefined for COMPLIANT', () => {
    expect(buildSkipResult('COMPLIANT')).toBeUndefined();
  });

  it('returns undefined for NON_COMPLIANT', () => {
    expect(buildSkipResult('NON_COMPLIANT')).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(buildSkipResult(undefined)).toBeUndefined();
  });
});
