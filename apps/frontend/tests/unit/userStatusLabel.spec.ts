import {describe, expect, it} from 'vitest';
import {userStatusLabel} from '../../src/utilities/helper_util';

describe('userStatusLabel', () => {
  it('marks disabled users without changing the original value', () => {
    const email = 'user@example.com';
    expect(userStatusLabel(email, true)).toBe('user@example.com (DISABLED)');
    expect(userStatusLabel(email, false)).toBe(email);
    expect(email).toBe('user@example.com');
  });
});
