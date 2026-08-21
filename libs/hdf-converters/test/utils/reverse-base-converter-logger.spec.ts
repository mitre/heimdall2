import type { ExecJSON } from 'inspecjs';
import { describe, expect, it, vi } from 'vitest';
import { FromHdfBaseConverter } from '../../src/converters-from-hdf/reverse-base-converter';
import { FromHDFToSplunkMapper } from '../../src/converters-from-hdf/splunk/reverse-splunk-mapper';
import { SonarqubeResults } from '../../src/sonarqube-mapper';

const minimalExecution: ExecJSON.Execution = {
  platform: { name: 'test', release: '1.0', target_id: '' },
  profiles: [],
  statistics: { duration: 0 },
  version: '1.0',
};

describe('FromHdfBaseConverter logger', () => {
  it('has logger instance property with info/debug/warn methods', () => {
    const converter = new FromHdfBaseConverter(minimalExecution);

    expect(converter.logger).toBeDefined();
    expect(converter.logger.info).toBeDefined();
    expect(converter.logger.debug).toBeDefined();
    expect(converter.logger.warn).toBeDefined();
    expect(converter.logger.error).toBeDefined();
  });

  it('accepts custom logService via constructor', () => {
    const customLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      verbose: vi.fn(),
      warn: vi.fn(),
    } as any;
    const converter = new FromHdfBaseConverter(minimalExecution, false, customLogger);

    expect(converter.logger).toBe(customLogger);
  });

  it('creates distinct logger per instance (uses class name in constructor)', () => {
    const converter1 = new FromHdfBaseConverter(minimalExecution);
    const converter2 = new FromHdfBaseConverter(minimalExecution);

    expect(converter1.logger).toBeDefined();
    expect(converter2.logger).toBeDefined();
    expect(converter1.logger).not.toBe(converter2.logger);
  });
});

describe('FromHDFToSplunkMapper logger', () => {
  it('logger is instance property (not module scope)', () => {
    const mapper = new FromHDFToSplunkMapper(minimalExecution);

    expect(mapper.logger).toBeDefined();
    expect(mapper.logger.info).toBeDefined();
    expect(mapper.logger.debug).toBeDefined();
    expect(mapper.logger.warn).toBeDefined();
  });

  it('accepts custom logService via constructor', () => {
    const customLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      verbose: vi.fn(),
      warn: vi.fn(),
    } as any;
    const mapper = new FromHDFToSplunkMapper(minimalExecution, customLogger);

    expect(mapper.logger).toBe(customLogger);
    expect(customLogger.debug).toHaveBeenCalledWith(
      'Initialized FromHDFToSplunkMapper successfully',
    );
  });

  it('each instance has its own logger (not shared module-scope)', () => {
    const mapper1 = new FromHDFToSplunkMapper(minimalExecution);
    const mapper2 = new FromHDFToSplunkMapper(minimalExecution);

    expect(mapper1.logger).not.toBe(mapper2.logger);
  });
});

describe('SonarqubeResults logger', () => {
  it('logger is instance property', () => {
    const results = new SonarqubeResults(
      'http://localhost:9000',
      'test-project',
      'test-token',
    );

    expect(results.logger).toBeDefined();
    expect(results.logger.info).toBeDefined();
    expect(results.logger.debug).toBeDefined();
    expect(results.logger.warn).toBeDefined();
  });

  it('logger created in constructor (no module-scope const)', () => {
    const results1 = new SonarqubeResults(
      'http://localhost:9000',
      'project-1',
      'token-1',
    );
    const results2 = new SonarqubeResults(
      'http://localhost:9000',
      'project-2',
      'token-2',
    );

    expect(results1.logger).not.toBe(results2.logger);
  });
});
