import {describe, expect, it} from 'vitest';
import {paginationQuerySchema} from './pagination-query.schema';

describe('paginationQuerySchema', () => {
  it('accepts valid params with all fields', () => {
    const result = paginationQuerySchema.safeParse({
      page: '2',
      per_page: '25',
      sort: 'filename',
      order: 'asc',
      q: 'rhel',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.perPage).toBe(25);
      expect(result.data.sort).toBe('filename');
      expect(result.data.order).toBe('asc');
      expect(result.data.q).toBe('rhel');
    }
  });

  it('applies defaults when no params provided', () => {
    const result = paginationQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(25);
      expect(result.data.sort).toBe('createdAt');
      expect(result.data.order).toBe('desc');
      expect(result.data.q).toBeUndefined();
    }
  });

  it('coerces string numbers from query params', () => {
    const result = paginationQuerySchema.safeParse({page: '3', per_page: '50'});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.perPage).toBe(50);
    }
  });

  it('clamps per_page to max 100', () => {
    const result = paginationQuerySchema.safeParse({per_page: '999'});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.perPage).toBe(100);
    }
  });

  it('enforces page >= 1', () => {
    const result = paginationQuerySchema.safeParse({page: '0'});
    expect(result.success).toBe(false);
  });

  it('rejects invalid sort column', () => {
    const result = paginationQuerySchema.safeParse({sort: 'DROP TABLE'});
    expect(result.success).toBe(false);
  });

  it('rejects invalid order direction', () => {
    const result = paginationQuerySchema.safeParse({order: 'sideways'});
    expect(result.success).toBe(false);
  });

  it('accepts legacy offset/limit params and converts to page/perPage', () => {
    const result = paginationQuerySchema.safeParse({offset: '20', limit: '10'});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.perPage).toBe(10);
    }
  });

  it('accepts legacy order array and converts to sort/order', () => {
    const result = paginationQuerySchema.safeParse({order: ['filename', 'ASC']});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('filename');
      expect(result.data.order).toBe('asc');
    }
  });

  it('accepts legacy searchFields and converts to q', () => {
    const result = paginationQuerySchema.safeParse({
      searchFields: ['(rhel|centos)', '()', '()'],
      useClause: 'true',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('rhel centos');
    }
  });
});
