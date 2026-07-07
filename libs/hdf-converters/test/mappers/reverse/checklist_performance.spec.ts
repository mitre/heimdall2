import { describe, expect, it } from 'vitest';
import { ChecklistResults } from '../../../src/ckl-mapper/checklist-mapper';
import { loadFixture } from '../../utils';

const XML_DECLARATION_RE = /^<\?xml version="1\.0"/v;
const VULN_TAG_RE = /<VULN>/gv;

describe('CKL export performance (9go.49)', () => {
  it('toCkl() without prettyPrint is faster than with prettyPrint', () => {
    const hdfData = loadFixture(
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
    );
    const mapper = new ChecklistResults(hdfData);

    const startRaw = performance.now();
    mapper.toCkl();
    const rawTime = performance.now() - startRaw;

    const startPretty = performance.now();
    mapper.toCkl({ prettyPrint: true });
    const prettyTime = performance.now() - startPretty;

    console.log(`Raw XML: ${rawTime.toFixed(1)}ms, Pretty XML: ${prettyTime.toFixed(1)}ms, Speedup: ${(prettyTime / rawTime).toFixed(1)}x`);

    expect(rawTime).toBeLessThan(prettyTime);
  });

  it('toCkl() default output is valid XML (starts with <?xml)', () => {
    const hdfData = loadFixture(
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
    );
    const mapper = new ChecklistResults(hdfData);
    const xml = mapper.toCkl();

    expect(xml).toMatch(XML_DECLARATION_RE);
    expect(xml).toContain('<CHECKLIST>');
    expect(xml).toContain('</CHECKLIST>');
  });

  it('toCkl({prettyPrint: true}) produces formatted output with indentation', () => {
    const hdfData = loadFixture(
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
    );
    const mapper = new ChecklistResults(hdfData);
    const xml = mapper.toCkl({ prettyPrint: true });

    expect(xml).toContain('\t');
    expect(xml).toContain('\n');
  });

  it('both outputs contain the same VULN count', () => {
    const hdfData = loadFixture(
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
    );
    const mapper = new ChecklistResults(hdfData);
    const raw = mapper.toCkl();
    const pretty = mapper.toCkl({ prettyPrint: true });

    const rawVulns = (raw.match(VULN_TAG_RE) || []).length;
    const prettyVulns = (pretty.match(VULN_TAG_RE) || []).length;

    expect(rawVulns).toBe(prettyVulns);
    expect(rawVulns).toBeGreaterThan(0);
  });
});
