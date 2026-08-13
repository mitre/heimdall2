import type { Request } from 'express';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { LoggingInterceptor } from './logging.interceptor';

const asRequest = (headers: Record<string, string>, ip: string): Request =>
  ({ headers, ip }) as unknown as Request;

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();
    // The interceptor's redaction behavior is driven by the REAL
    // ConfigService.sensitiveKeys patterns — mocking them would test nothing.
    interceptor = new LoggingInterceptor(module.get(ConfigService));
  });

  describe('redact', () => {
    it('redacts values whose keys match the sensitive patterns', () => {
      const result = interceptor.redact({
        filename: 'kept',
        apiKey: 'hunter2',
        password: 'hunter2',
        token: 'hunter2',
      });

      expect(result).toEqual({
        filename: 'kept',
        apiKey: '[REDACTED]',
        password: '[REDACTED]',
        token: '[REDACTED]',
      });
    });

    it('is shallow: nested sensitive keys are NOT redacted', () => {
      // Pins the current contract so a future "fix" that deep-redacts (or a
      // refactor that silently stops at depth 0) is a visible decision.
      const result = interceptor.redact({
        nested: { password: 'hunter2' },
      });

      expect(result).toEqual({ nested: { password: 'hunter2' } });
    });

    it('returns undefined for non-object bodies', () => {
      expect(interceptor.redact(undefined)).toBeUndefined();
      expect(
        interceptor.redact('password=x' as unknown as Record<string, unknown>),
      ).toBeUndefined();
    });

    it('never mutates the request body it was given', () => {
      const body = { password: 'hunter2' };

      interceptor.redact(body);

      expect(body.password).toBe('hunter2');
    });

    it('handles an own __proto__ key from parsed JSON without polluting', () => {
      // JSON.parse creates __proto__ as an OWN data property, bypassing the
      // setter — exactly what an express.json request body can contain.
      const body = JSON.parse('{"__proto__": {"polluted": true}, "a": 1}');

      const result = interceptor.redact(body);

      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(result).toMatchObject({ a: 1 });
    });
  });

  describe('getRealIP', () => {
    it('reports proxy chain when x-forwarded-for is present', () => {
      const request = asRequest({ 'x-forwarded-for': '10.0.0.7' }, '127.0.0.1');

      expect(interceptor.getRealIP(request)).toBe('10.0.0.7 -> 127.0.0.1');
    });

    it('falls back to the socket ip without proxy headers', () => {
      const request = asRequest({ referer: 'https://example.org' }, '127.0.0.1');

      expect(interceptor.getRealIP(request)).toBe('127.0.0.1');
    });
  });
});
