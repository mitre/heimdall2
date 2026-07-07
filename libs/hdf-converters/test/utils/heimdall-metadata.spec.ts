import fs from 'fs';
import { type ExecJSON } from 'inspecjs';
import { describe, expect, it } from 'vitest';
import { HeimdallToolsVersion } from '../../src/utils/global';
import { createHeimdallPassthrough } from '../../src/utils/heimdall_metadata';
import { ZapResults } from '../../src/zap-mapper';

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
    const rawData = { rawFindings: [{ id: 1 }], scanId: '12345' };
    const result = createHeimdallPassthrough('nessus', rawData);

    expect(result.heimdall.sourceFormat).toBe('nessus');
    expect(result.scanId).toBe('12345');
    expect(result.rawFindings).toEqual([{ id: 1 }]);
  });

  it('does not overwrite heimdall field with extra data', () => {
    const result = createHeimdallPassthrough('burp', { heimdall: 'should not overwrite' });
    expect(result.heimdall.sourceFormat).toBe('burp');
    expect(result.heimdall.toolVersion).toBe(HeimdallToolsVersion);
  });

  it('works with no extra data', () => {
    const result = createHeimdallPassthrough('sarif');
    expect(Object.keys(result)).toEqual(['heimdall']);
  });

  it('ZAP mapper output contains passthrough.heimdall.sourceFormat', async () => {
    const zapInput = fs.readFileSync(
      'sample_jsons/zap_mapper/sample_input_report/zero.webappsecurity.json',
      { encoding: 'utf8' },
    );
    const mapper = new ZapResults(zapInput, 'https://zero.webappsecurity.com');
    const result = await mapper.toHdf() as ExecJSON.Execution & { passthrough: Record<string, unknown> };

    expect(result.passthrough).toBeDefined();
    expect(result.passthrough.heimdall).toBeDefined();
    expect((result.passthrough.heimdall as Record<string, unknown>).sourceFormat).toBe('zap');
    expect((result.passthrough.heimdall as Record<string, unknown>).toolVersion).toBe(HeimdallToolsVersion);
  });

  it('preserves all INPUT_TYPES format values', () => {
    const formats = [
      'asff', 'burp', 'checklist', 'checkov', 'conveyor',
      'dependencyTrack', 'fortify', 'gosec', 'grype', 'ionchannel',
      'jfrog', 'msft_secure_score', 'nikto', 'sarif', 'cyclonedx_sbom',
      'snyk', 'trufflehog', 'twistlock', 'zap', 'nessus', 'neuvector',
      'xccdf', 'netsparker', 'scoutsuite', 'dbProtect', 'prisma', 'veracode',
    ];
    for (const fmt of formats) {
      const result = createHeimdallPassthrough(fmt);
      expect(result.heimdall.sourceFormat).toBe(fmt);
    }
  });
});
