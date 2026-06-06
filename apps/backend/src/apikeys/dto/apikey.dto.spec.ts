import {describe, it, expect} from 'vitest';
import {APIKeyDto} from './apikey.dto';
import type {SelectApiKey} from '../../db/zod-schemas';

describe('APIKeyDto', () => {
  it('constructs from a Drizzle SelectApiKey with correct types', () => {
    const source: SelectApiKey = {
      id: 42,
      userId: 1,
      groupId: null,
      name: 'my-key',
      apiKey: 'hashed',
      type: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    const dto = new APIKeyDto(source);
    expect(dto.id).toBe('42');
    expect(dto.name).toBe('my-key');
    expect(dto.type).toBe('user');
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.updatedAt).toBeInstanceOf(Date);
    expect(dto.createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('handles null name gracefully', () => {
    const source: SelectApiKey = {
      id: 1,
      userId: null,
      groupId: 5,
      name: null,
      apiKey: null,
      type: 'group',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const dto = new APIKeyDto(source);
    expect(dto.name).toBe('');
    expect(dto.type).toBe('group');
  });

  it('returns string id even when source has numeric id', () => {
    const source: SelectApiKey = {
      id: 99,
      userId: 1,
      groupId: null,
      name: 'test',
      apiKey: 'x',
      type: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const dto = new APIKeyDto(source);
    expect(typeof dto.id).toBe('string');
    expect(dto.id).toBe('99');
  });
});
