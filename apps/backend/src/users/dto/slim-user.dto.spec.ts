import {describe, it, expect} from 'vitest';
import {SlimUserDto} from './slim-user.dto';

describe('SlimUserDto', () => {
  it('constructs from Drizzle SelectUser (numeric id)', () => {
    const dto = new SlimUserDto({
      id: 42,
      email: 'a@b.com',
      title: 'Eng',
      firstName: 'A',
      lastName: 'B',
    });
    expect(dto.id).toBe('42');
    expect(dto.email).toBe('a@b.com');
    expect(dto.firstName).toBe('A');
  });

  it('constructs from Sequelize User (string id)', () => {
    const dto = new SlimUserDto({
      id: '99',
      email: 'c@d.com',
      title: null,
      firstName: null,
      lastName: null,
    });
    expect(dto.id).toBe('99');
    expect(dto.title).toBeUndefined();
    expect(dto.firstName).toBeUndefined();
  });

  it('includes groupRole when provided', () => {
    const dto = new SlimUserDto(
      {id: 1, email: 'x@y.com'},
      'owner',
    );
    expect(dto.groupRole).toBe('owner');
  });

  it('groupRole is undefined when not provided', () => {
    const dto = new SlimUserDto({id: 1, email: 'x@y.com'});
    expect(dto.groupRole).toBeUndefined();
  });
});
