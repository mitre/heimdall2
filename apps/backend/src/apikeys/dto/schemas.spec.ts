import {describe, it, expect} from 'vitest';
import {createApiKeySchema} from './create-apikey.schema';
import {updateApiKeySchema} from './update-apikey.schema';
import {deleteApiKeySchema} from './delete-apikey.schema';

describe('createApiKeySchema', () => {
  it('accepts valid create payload with name and userId', () => {
    const result = createApiKeySchema.safeParse({
      userId: '1',
      name: 'my-key',
      currentPassword: 'secret',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('1');
      expect(result.data.name).toBe('my-key');
    }
  });

  it('accepts payload with groupId instead of userId', () => {
    const result = createApiKeySchema.safeParse({
      groupId: '5',
      name: 'group-key',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = createApiKeySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects non-string userId', () => {
    const result = createApiKeySchema.safeParse({userId: 123});
    expect(result.success).toBe(false);
  });
});

describe('updateApiKeySchema', () => {
  it('accepts valid update payload with name', () => {
    const result = updateApiKeySchema.safeParse({name: 'new-name'});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('new-name');
    }
  });

  it('rejects missing name', () => {
    const result = updateApiKeySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts name with optional currentPassword', () => {
    const result = updateApiKeySchema.safeParse({
      name: 'x',
      currentPassword: 'pw',
    });
    expect(result.success).toBe(true);
  });
});

describe('deleteApiKeySchema', () => {
  it('accepts empty object (password optional)', () => {
    const result = deleteApiKeySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts currentPassword', () => {
    const result = deleteApiKeySchema.safeParse({currentPassword: 'pw'});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentPassword).toBe('pw');
    }
  });
});
