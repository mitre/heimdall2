import { describe, expect, it, vi } from 'vitest';
import type { ExecJSON } from 'inspecjs';
import { BaseConverter, BaseResults } from '../../src/base-converter';

class MockMapper extends BaseConverter {
  mappings = {
    platform: { name: 'test', release: '1.0', target_id: '' },
    profiles: [{
      attributes: [],
      controls: [{ id: 'test-1', title: 'Test Control', code: '', desc: '', impact: 0.5, refs: [], results: [], source_location: {}, tags: {} }],
      depends: [],
      groups: [],
      name: 'mock-profile',
      sha256: '',
      status: 'loaded',
      supports: [],
      title: 'Mock Profile',
    }],
    statistics: {},
    version: '1.0.0',
  } as unknown as any;
}

class SimpleMockResults extends BaseResults {
  protected createMapper(data: unknown): BaseConverter {
    return new MockMapper(data as Record<string, unknown>);
  }
}

class XmlMockResults extends BaseResults {
  protected parse(input: string): Record<string, unknown> {
    return { raw: input };
  }

  protected createMapper(data: unknown): BaseConverter {
    return new MockMapper(data as Record<string, unknown>);
  }
}

class AsyncInitMockResults extends BaseResults {
  initCalled = false;

  protected async init(): Promise<void> {
    this.initCalled = true;
  }

  protected createMapper(data: unknown): BaseConverter {
    return new MockMapper(data as Record<string, unknown>);
  }
}

class ArrayMockResults extends BaseResults<Record<string, unknown>[], ExecJSON.Execution[]> {
  protected parse(input: string): Record<string, unknown>[] {
    return JSON.parse(input) as Record<string, unknown>[];
  }

  protected split(parsed: Record<string, unknown>[]): Record<string, unknown>[] {
    return parsed;
  }

  protected createMapper(data: unknown): BaseConverter {
    return new MockMapper(data as Record<string, unknown>);
  }
}

describe('BaseResults', () => {
  describe('lifecycle', () => {
    it('parse() runs in toHdf(), not in constructor', async () => {
      const results = new SimpleMockResults('{"key": "value"}');
      expect(results['parsed']).toBeUndefined();
      await results.toHdf();
      expect(results['parsed']).toEqual({ key: 'value' });
    });

    it('init() runs after parse() and before createMapper()', async () => {
      const results = new AsyncInitMockResults('{"key": "value"}');
      expect(results.initCalled).toBe(false);
      await results.toHdf();
      expect(results.initCalled).toBe(true);
    });

    it('parse() override works for non-JSON input', async () => {
      const results = new XmlMockResults('<xml>data</xml>');
      const output = await results.toHdf();
      expect(output).toBeDefined();
      expect(output.profiles).toBeDefined();
    });

    it('array output works when split() returns array', async () => {
      const results = new ArrayMockResults('[{"a":1},{"b":2}]');
      const output = await results.toHdf();
      expect(Array.isArray(output)).toBe(true);
      expect(output).toHaveLength(2);
    });
  });

  describe('logger', () => {
    it('logger is available on BaseResults instance', () => {
      const results = new SimpleMockResults('{}');
      expect(results.logger).toBeDefined();
      expect(results.logger.info).toBeDefined();
      expect(results.logger.debug).toBeDefined();
      expect(results.logger.warn).toBeDefined();
    });

    it('logger uses class name by default', () => {
      const results = new SimpleMockResults('{}');
      expect(results.logger).toBeDefined();
    });

    it('custom logService is used when provided', () => {
      const customLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() } as any;
      const results = new SimpleMockResults('{}', customLogger);
      expect(results.logger).toBe(customLogger);
    });

    it('toHdf() logs info on start and complete', async () => {
      const mockLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), verbose: vi.fn() } as any;
      const results = new SimpleMockResults('{"key":"value"}', mockLogger);
      await results.toHdf();
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info.mock.calls[0][0]).toContain('Starting');
      expect(mockLogger.info.mock.calls[0][0]).toContain('SimpleMockResults');
      expect(mockLogger.info.mock.calls[1][0]).toContain('complete');
    });
  });
});

describe('BaseConverter logger', () => {
  it('logger is available on BaseConverter instance', () => {
    const mapper = new MockMapper({});
    expect(mapper.logger).toBeDefined();
    expect(mapper.logger.info).toBeDefined();
  });

  it('custom logService is used when provided', () => {
    const customLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() } as any;
    const mapper = new MockMapper({}, false, customLogger);
    expect(mapper.logger).toBe(customLogger);
  });

  it('toHdf() logs info on start and complete with control count', () => {
    const mockLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), verbose: vi.fn() } as any;
    const mapper = new MockMapper({}, false, mockLogger);
    mapper.toHdf();
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
    expect(mockLogger.info.mock.calls[0][0]).toContain('Starting');
    expect(mockLogger.info.mock.calls[0][0]).toContain('MockMapper');
    expect(mockLogger.info.mock.calls[1][0]).toContain('complete');
    expect(mockLogger.info.mock.calls[1][0]).toContain('1 controls');
  });
});
