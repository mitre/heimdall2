import {describe, expect, it} from 'vitest';
import {createHeimdallPassthrough} from '../../src/utils/heimdall_metadata';
import {HeimdallToolsVersion} from '../../src/utils/global';

describe('createHeimdallPassthrough', () => {
  it('returns object with heimdall.sourceFormat set', () => {
    const result = createHeimdallPassthrough('zap');
    expect(result.heimdall.sourceFormat).toBe('zap');
  });

  it('includes toolVersion from HeimdallToolsVersion', () => {
    const result = createHeimdallPassthrough('fortify');
    expect(result.heimdall.toolVersion).toBe(HeimdallToolsVersion);
  });

  it('merges extra passthrough data alongside heimdall metadata', () => {
    const rawData = {scanId: '12345', rawFindings: [{id: 1}]};
    const result = createHeimdallPassthrough('nessus', rawData);

    expect(result.heimdall.sourceFormat).toBe('nessus');
    expect(result.scanId).toBe('12345');
    expect(result.rawFindings).toEqual([{id: 1}]);
  });

  it('does not overwrite heimdall field with extra data', () => {
    const result = createHeimdallPassthrough('burp', {
      heimdall: 'should not overwrite'
    });
    expect(result.heimdall.sourceFormat).toBe('burp');
    expect(result.heimdall.toolVersion).toBe(HeimdallToolsVersion);
  });

  it('works with no extra data', () => {
    const result = createHeimdallPassthrough('sarif');
    expect(Object.keys(result)).toEqual(['heimdall']);
  });

  it('preserves all INPUT_TYPES format values', () => {
    const formats = [
      'asff', 'burp', 'checklist', 'checkov', 'conveyor',
      'dependencyTrack', 'fortify', 'gosec', 'grype', 'ionchannel',
      'jfrog', 'msft_secure_score', 'nikto', 'sarif', 'cyclonedx_sbom',
      'snyk', 'trufflehog', 'twistlock', 'zap', 'nessus', 'neuvector',
      'xccdf', 'netsparker', 'scoutsuite', 'dbProtect', 'prisma', 'veracode'
    ];
    for (const fmt of formats) {
      const result = createHeimdallPassthrough(fmt);
      expect(result.heimdall.sourceFormat).toBe(fmt);
    }
  });
});
