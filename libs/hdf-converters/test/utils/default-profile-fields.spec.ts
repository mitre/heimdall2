import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE_FIELDS } from '../../src/base-converter';

const schema = JSON.parse(
  fs.readFileSync('../../libs/inspecjs/schemas/exec-json.json', 'utf8'),
);
const profileDef = schema.definitions.Exec_JSON_Profile;
const requiredFields = new Set(profileDef.required as string[]);
const allFields = Object.keys(profileDef.properties as Record<string, unknown>);

const PER_MAPPER_FIELDS = new Set(['controls', 'name']);
const INTENTIONAL_NON_NULL_DEFAULTS = new Set(['status']);

describe('DEFAULT_PROFILE_FIELDS', () => {
  it('contains all required array fields as empty arrays', () => {
    for (const field of allFields) {
      if (!requiredFields.has(field) || PER_MAPPER_FIELDS.has(field)) {
        continue;
      }
      const propType = (profileDef.properties as Record<string, any>)[field].type;
      if (propType === 'array') {
        expect(DEFAULT_PROFILE_FIELDS).toHaveProperty(field);
        expect(DEFAULT_PROFILE_FIELDS[field as keyof typeof DEFAULT_PROFILE_FIELDS]).toEqual([]);
      }
    }
  });

  it('contains sha256 as empty string placeholder', () => {
    expect(DEFAULT_PROFILE_FIELDS).toHaveProperty('sha256', '');
  });

  it('contains status as loaded', () => {
    expect(DEFAULT_PROFILE_FIELDS).toHaveProperty('status', 'loaded');
  });

  it('contains all optional string|null fields as null (except intentional defaults)', () => {
    for (const field of allFields) {
      if (requiredFields.has(field) || PER_MAPPER_FIELDS.has(field) || INTENTIONAL_NON_NULL_DEFAULTS.has(field)) {
        continue;
      }
      const propType = (profileDef.properties as Record<string, any>)[field].type;
      if (Array.isArray(propType) && propType.includes('string') && propType.includes('null')) {
        expect(
          DEFAULT_PROFILE_FIELDS,
          `optional field "${field}" should be present with value null`,
        ).toHaveProperty(field, null);
      }
    }
  });

  it('contains depends as empty array', () => {
    expect(DEFAULT_PROFILE_FIELDS).toHaveProperty('depends');
    expect(DEFAULT_PROFILE_FIELDS.depends).toEqual([]);
  });

  it('does NOT contain per-mapper fields (name, controls)', () => {
    for (const field of PER_MAPPER_FIELDS) {
      expect(DEFAULT_PROFILE_FIELDS).not.toHaveProperty(field);
    }
  });

  it('covers every schema field except per-mapper fields', () => {
    const defaultKeys = new Set(Object.keys(DEFAULT_PROFILE_FIELDS));
    for (const field of allFields) {
      if (PER_MAPPER_FIELDS.has(field)) {
        continue;
      }
      expect(
        defaultKeys.has(field),
        `schema field "${field}" is missing from DEFAULT_PROFILE_FIELDS`,
      ).toBe(true);
    }
  });
});
