import { describe, expect, it, vi } from 'vitest';
import {
  consolidatePayloads,
  groupBy,
  mapHash,
  SplunkMapper,
} from '../../../src/splunk-mapper';
import type { SplunkConfig } from '../../../types/splunk-config-types';

const mockConfig: SplunkConfig = {
  host: 'localhost',
  index: 'main',
  password: 'changeme',
  port: 8089,
  scheme: 'https',
  username: 'admin',
};

describe('groupBy', () => {
  it('groups items by key function into Map entries', () => {
    const items = [
      { group: 'x', name: 'a' },
      { group: 'y', name: 'b' },
      { group: 'x', name: 'c' },
    ];
    const result = groupBy(items, item => item.group);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(2);
    expect(result.get('x')).toEqual([
      { group: 'x', name: 'a' },
      { group: 'x', name: 'c' },
    ]);
    expect(result.get('y')).toEqual([{ group: 'y', name: 'b' }]);
  });

  it('produces one-entry Map when all items share same key', () => {
    const items = [
      { id: 1, type: 'same' },
      { id: 2, type: 'same' },
    ];
    const result = groupBy(items, item => item.type);

    expect(result.size).toBe(1);
    expect(result.get('same')).toHaveLength(2);
    expect(result.get('same')).toEqual([
      { id: 1, type: 'same' },
      { id: 2, type: 'same' },
    ]);
  });

  it('produces empty Map from empty input', () => {
    const result = groupBy([], () => 'key');

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });
});

describe('mapHash', () => {
  it('transforms all Map values using the provided function', () => {
    const input = new Map<string, number[]>([
      ['a', [1, 2, 3]],
      ['b', [4, 5]],
    ]);
    const result = mapHash(input, values => values.reduce((s, v) => s + v, 0));

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(2);
    expect(result.get('a')).toBe(6);
    expect(result.get('b')).toBe(9);
  });

  it('preserves keys when transforming values', () => {
    const input = new Map<string, string>([
      ['key1', 'hello'],
      ['key2', 'world'],
    ]);
    const result = mapHash(input, v => v.toUpperCase());

    expect(result.get('key1')).toBe('HELLO');
    expect(result.get('key2')).toBe('WORLD');
  });

  it('produces empty Map from empty Map', () => {
    const result = mapHash(new Map(), v => v);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });
});

describe('consolidatePayloads', () => {
  it('accepts optional logger parameter', () => {
    const mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      verbose: vi.fn(),
      warn: vi.fn(),
    } as any;

    expect(() =>
      consolidatePayloads([], mockLogger),
    ).not.toThrow();
  });

  it('uses default logger when none provided', () => {
    expect(() =>
      consolidatePayloads([]),
    ).not.toThrow();
  });
});

describe('SplunkMapper logger DI', () => {
  it('accepts custom logService and uses it', () => {
    const customLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      verbose: vi.fn(),
      warn: vi.fn(),
    } as any;
    const mapper = new SplunkMapper(mockConfig, customLogger);

    expect(mapper.logger).toBe(customLogger);
    expect(customLogger.debug).toHaveBeenCalledWith(
      'Initialized SplunkMapper successfully',
    );
  });

  it('creates default logger when no logService provided', () => {
    const mapper = new SplunkMapper(mockConfig);

    expect(mapper.logger).toBeDefined();
    expect(mapper.logger.info).toBeDefined();
    expect(mapper.logger.debug).toBeDefined();
    expect(mapper.logger.warn).toBeDefined();
    expect(mapper.logger.error).toBeDefined();
  });

  it('passes loggingLevel to default logger constructor', () => {
    const mapper = new SplunkMapper(mockConfig, undefined, 'info');

    expect(mapper.logger).toBeDefined();
    expect(mapper.logger.level).toBe('info');
  });
});
