import {describe, expect, it} from 'vitest';
import {buildSwaggerConfig} from './swagger.config';

describe('swagger config', () => {
  it('produces a valid OpenAPI document config with title and version', () => {
    const config = buildSwaggerConfig();
    expect(config.info.title).toBe('Heimdall Enterprise Server API');
    expect(config.info.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('includes contact and license information', () => {
    const config = buildSwaggerConfig();
    expect(config.info.contact?.name).toBe('MITRE SAF Team');
    expect(config.info.license?.name).toBe('Apache-2.0');
  });

  it('includes bearer auth security scheme', () => {
    const config = buildSwaggerConfig();
    const components = config.components as Record<string, Record<string, {type: string; scheme?: string}>>;
    expect(components.securitySchemes?.bearer?.type).toBe('http');
    expect(components.securitySchemes?.bearer?.scheme).toBe('bearer');
  });

  it('includes cookie auth security scheme', () => {
    const config = buildSwaggerConfig();
    const components = config.components as Record<string, Record<string, {type: string; in?: string; name?: string}>>;
    expect(components.securitySchemes?.cookie?.type).toBe('apiKey');
    expect(components.securitySchemes?.cookie?.in).toBe('cookie');
  });
});
