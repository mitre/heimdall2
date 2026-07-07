import { describe, expect, it } from 'vitest';
import {
  getSourceFormatColor,
  getSourceFormatLabel,
} from '@/utilities/source_format_util';

describe('source format label mapping', () => {
  it('maps inspec-json to InSpec JSON', () => {
    expect(getSourceFormatLabel('inspec-json')).toBe('InSpec JSON');
  });

  it('maps inspec-profile to InSpec Profile', () => {
    expect(getSourceFormatLabel('inspec-profile')).toBe('InSpec Profile');
  });

  it('maps checklist to DISA Checklist', () => {
    expect(getSourceFormatLabel('checklist')).toBe('DISA Checklist');
  });

  it('maps xccdf to XCCDF Results', () => {
    expect(getSourceFormatLabel('xccdf')).toBe('XCCDF Results');
  });

  it('maps nessus to Nessus', () => {
    expect(getSourceFormatLabel('nessus')).toBe('Nessus');
  });

  it('maps asff to AWS Security Finding', () => {
    expect(getSourceFormatLabel('asff')).toBe('AWS Security Finding');
  });

  it('maps sarif to SARIF', () => {
    expect(getSourceFormatLabel('sarif')).toBe('SARIF');
  });

  it('maps fortify to Fortify', () => {
    expect(getSourceFormatLabel('fortify')).toBe('Fortify');
  });

  it('maps veracode to Veracode', () => {
    expect(getSourceFormatLabel('veracode')).toBe('Veracode');
  });

  it('maps unknown format to titlecased input', () => {
    expect(getSourceFormatLabel('someNewScanner')).toBe('someNewScanner');
  });

  it('returns empty string for undefined', () => {
    expect(getSourceFormatLabel()).toBe('');
  });
});

describe('source format color mapping (Vuetify theme keys)', () => {
  it('returns formatInspec for InSpec formats', () => {
    expect(getSourceFormatColor('inspec-json')).toBe('formatInspec');
    expect(getSourceFormatColor('inspec-profile')).toBe('formatInspec');
  });

  it('returns formatStig for STIG tools', () => {
    expect(getSourceFormatColor('checklist')).toBe('formatStig');
    expect(getSourceFormatColor('xccdf')).toBe('formatStig');
  });

  it('returns formatCode for code analysis', () => {
    expect(getSourceFormatColor('fortify')).toBe('formatCode');
    expect(getSourceFormatColor('veracode')).toBe('formatCode');
    expect(getSourceFormatColor('sarif')).toBe('formatCode');
  });

  it('returns formatUnknown for unknown', () => {
    expect(getSourceFormatColor('unknownThing')).toBe('formatUnknown');
    expect(getSourceFormatColor()).toBe('formatUnknown');
  });
});
