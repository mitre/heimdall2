import fs from 'fs';
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_NEW_FIELDS,
  FIXTURE_REGISTRY,
  getFixtureEntries,
  getMapperNames,
  validateMapperOutput,
} from '../../scripts/regenerate-fixtures.mts';

describe('regenerate-fixtures registry', () => {
  it('exports a non-empty FIXTURE_REGISTRY', () => {
    expect(FIXTURE_REGISTRY.size).toBeGreaterThan(0);
  });

  it('getMapperNames returns all registered mapper names', () => {
    const names = getMapperNames();
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain('anchore-grype');
    expect(names).toContain('fortify');
    expect(names).toContain('gosec');
  });

  it('getFixtureEntries returns entries for a specific mapper', () => {
    const entries = getFixtureEntries('anchore-grype');
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry).toHaveProperty('inputFile');
      expect(entry).toHaveProperty('outputFile');
      expect(entry).toHaveProperty('mapperFactory');
      expect(typeof entry.inputFile).toBe('string');
      expect(typeof entry.outputFile).toBe('string');
      expect(typeof entry.mapperFactory).toBe('function');
    }
  });

  it('getFixtureEntries returns empty array for unknown mapper', () => {
    expect(getFixtureEntries('nonexistent-mapper')).toEqual([]);
  });

  it('every non-external entry has valid input and output file paths', () => {
    for (const [name, entries] of FIXTURE_REGISTRY) {
      for (const entry of entries) {
        if (entry.isExternal) {
          expect(entry.outputFile, `${name}: outputFile should be a non-empty string`).toBeTruthy();
          continue;
        }
        expect(entry.inputFile, `${name}: inputFile should be a non-empty string`).toBeTruthy();
        expect(entry.outputFile, `${name}: outputFile should be a non-empty string`).toBeTruthy();
        expect(entry.inputFile).toMatch(/^sample_jsons\//);
        expect(entry.outputFile).toMatch(/^sample_jsons\//);
      }
    }
  });

  it('every registered entry has isAsync flag', () => {
    for (const [_name, entries] of FIXTURE_REGISTRY) {
      for (const entry of entries) {
        expect(typeof entry.isAsync).toBe('boolean');
      }
    }
  });

  it('skips external-service mappers by default in getMapperNames', () => {
    const names = getMapperNames({ includeExternal: false });
    expect(names).not.toContain('sonarqube');
    expect(names).not.toContain('splunk-reverse');
  });

  it('includes external-service mappers when requested', () => {
    const names = getMapperNames({ includeExternal: true });
    expect(names).toContain('sonarqube');
  });

  it('ALLOWED_NEW_FIELDS matches InSpec JSON schema optional profile fields', () => {
    const schema = JSON.parse(
      fs.readFileSync('../../libs/inspecjs/schemas/exec-json.json', 'utf8'),
    );
    const profileDef = schema.definitions.Exec_JSON_Profile;
    const required = new Set(profileDef.required as string[]);
    const perMapper = new Set(['name', 'controls']);
    const optionalFields = Object.keys(profileDef.properties as Record<string, unknown>)
      .filter(f => !required.has(f) && !perMapper.has(f))
      .toSorted((a, b) => a.localeCompare(b));
    const allowedSorted = [...ALLOWED_NEW_FIELDS].toSorted((a, b) => a.localeCompare(b));
    expect(allowedSorted).toEqual(optionalFields);
  });

  it('validateMapperOutput returns PASS when output matches fixture', async () => {
    const result = await validateMapperOutput('anchore-grype');
    for (const entry of result) {
      if (entry.isSkipped) {
        continue;
      }
      expect(entry.verdict, `${entry.outputFile}: ${entry.unexpectedDiffs?.join(', ')}`).toBe('PASS');
    }
  });

  it('validateMapperOutput flags unexpected field changes', async () => {
    const result = await validateMapperOutput('anchore-grype');
    for (const entry of result) {
      if (entry.isSkipped) {
        continue;
      }
      expect(entry.unexpectedDiffs).toEqual([]);
    }
  });

  it('every non-external entry has input files that exist on disk', () => {
    for (const [name, entries] of FIXTURE_REGISTRY) {
      for (const entry of entries) {
        if (entry.isExternal) {
          continue;
        }
        expect(
          fs.existsSync(entry.inputFile),
          `${name}: input file not found: ${entry.inputFile}`,
        ).toBe(true);
      }
    }
  });
});
