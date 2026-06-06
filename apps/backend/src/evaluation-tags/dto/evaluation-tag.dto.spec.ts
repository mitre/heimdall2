import {describe, it, expect} from 'vitest';
import {EvaluationTagDto} from './evaluation-tag.dto';

describe('EvaluationTagDto', () => {
  it('constructs from Drizzle SelectEvaluationTag (numeric id, string timestamps)', () => {
    const dto = new EvaluationTagDto({
      id: 42,
      value: 'stig',
      evaluationId: 10,
      createdAt: '2026-06-01T12:00:00.000Z',
      updatedAt: '2026-06-01T13:00:00.000Z',
    });
    expect(dto.id).toBe('42');
    expect(dto.value).toBe('stig');
    expect(dto.evaluationId).toBe('10');
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.updatedAt).toBeInstanceOf(Date);
  });

  it('constructs from Sequelize EvaluationTag (string id, Date timestamps)', () => {
    const dto = new EvaluationTagDto({
      id: '99' as any,
      value: 'cis',
      evaluationId: '5' as any,
      createdAt: new Date('2026-06-01T12:00:00Z') as any,
      updatedAt: new Date('2026-06-01T13:00:00Z') as any,
    });
    expect(dto.id).toBe('99');
    expect(dto.value).toBe('cis');
    expect(dto.evaluationId).toBe('5');
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.updatedAt).toBeInstanceOf(Date);
  });

  it('converts all IDs to strings for API contract', () => {
    const dto = new EvaluationTagDto({
      id: 1,
      value: 'test',
      evaluationId: 2,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(typeof dto.id).toBe('string');
    expect(typeof dto.evaluationId).toBe('string');
  });
});
