import {describe, expect, it} from 'vitest';
import {asAuthUser, caslSubject, type RequestUser} from './auth-helpers';

describe('asAuthUser', () => {
  it('converts numeric id to string', () => {
    const user: RequestUser = {id: 42, role: 'user'};
    const result = asAuthUser(user);
    expect(result).toEqual({id: '42', role: 'user'});
  });

  it('preserves string id as-is', () => {
    const user: RequestUser = {id: 'abc-uuid', role: 'admin'};
    const result = asAuthUser(user);
    expect(result).toEqual({id: 'abc-uuid', role: 'admin'});
  });

  it('returns only id and role regardless of extra properties', () => {
    const user = {id: 1, role: 'user', creationMethod: 'local', email: 'a@b.com'} as RequestUser;
    const result = asAuthUser(user);
    expect(Object.keys(result)).toEqual(['id', 'role']);
  });
});

describe('caslSubject', () => {
  it('wraps a User entity with string id', () => {
    const entity = {id: 7, email: 'test@test.com', role: 'user'};
    const result = caslSubject('User', entity);
    expect(result.id).toBe('7');
    expect(result.email).toBe('test@test.com');
  });

  it('wraps a Group entity with string id', () => {
    const entity = {id: 99, name: 'Test Group'};
    const result = caslSubject('Group', entity);
    expect(result.id).toBe('99');
    expect(result.name).toBe('Test Group');
  });

  it('preserves string id without conversion', () => {
    const entity = {id: 'uuid-123', name: 'Already string'};
    const result = caslSubject('Evaluation', entity);
    expect(result.id).toBe('uuid-123');
  });

  it('spreads all entity properties onto the result', () => {
    const entity = {id: 1, name: 'G', public: true, extra: 'data'};
    const result = caslSubject('Group', entity);
    expect(result.name).toBe('G');
    expect(result.public).toBe(true);
    expect(result.extra).toBe('data');
  });
});
