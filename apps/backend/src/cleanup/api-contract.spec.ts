import {describe, it, expect} from 'vitest';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {APIKeyDto} from '../apikeys/dto/apikey.dto';

describe('API contract fixes', () => {
  describe('APIKeyDto', () => {
    it('includes userId and groupId fields', () => {
      const dto = new APIKeyDto({
        id: 1, userId: 5, groupId: null,
        name: 'key', apiKey: 'hash', type: 'user',
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      });
      expect(dto).toHaveProperty('userId');
      expect(dto.userId).toBe('5');
    });

    it('sets groupId when present', () => {
      const dto = new APIKeyDto({
        id: 2, userId: null, groupId: 3,
        name: 'gkey', apiKey: 'hash', type: 'group',
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      });
      expect(dto.groupId).toBe('3');
      expect(dto.userId).toBeUndefined();
    });
  });

  describe('Evaluations route ordering', () => {
    it('GET e2e route is declared before GET :id route', () => {
      const source = readFileSync(
        resolve(__dirname, '../evaluations/evaluations.controller.ts'), 'utf-8',
      );
      const e2ePos = source.indexOf("@Get('e2e')");
      const idPos = source.indexOf("@Get(':id')");
      expect(e2ePos).toBeGreaterThan(-1);
      expect(idPos).toBeGreaterThan(-1);
      expect(e2ePos).toBeLessThan(idPos);
    });
  });
});
