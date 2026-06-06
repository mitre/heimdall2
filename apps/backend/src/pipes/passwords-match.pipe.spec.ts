import {BadRequestException} from '@nestjs/common';
import {beforeEach, describe, expect, it} from 'vitest';
import type {CreateUserDto} from '../users/dto/create-user.dto';
import type {UpdateUserDto} from '../users/dto/update-user.dto';
import {PasswordsMatchPipe} from './passwords-match.pipe';

function buildCreateUserDto(
  overrides: Partial<CreateUserDto> = {}
): CreateUserDto {
  return {
    email: `match-${Date.now()}@pipe.test`,
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123$$$tP',
    firstName: 'Test',
    lastName: 'Dummy',
    title: 'fake title',
    organization: 'Fake Org',
    role: 'user',
    creationMethod: 'local',
    ...overrides
  };
}

function buildUpdateUserDto(
  overrides: Partial<UpdateUserDto> = {}
): UpdateUserDto {
  return {
    email: `match-update-${Date.now()}@pipe.test`,
    firstName: 'Updated',
    lastName: 'Name',
    organization: 'Updated Org',
    title: 'updated title',
    role: 'user',
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123$$$tP',
    currentPassword: 'LETmeiN123$$$tP',
    forcePasswordChange: true,
    ...overrides
  };
}

describe('PasswordsMatchPipe', () => {
  let passwordsMatchPipe: PasswordsMatchPipe;

  beforeEach(() => {
    passwordsMatchPipe = new PasswordsMatchPipe();
  });

  it('should make sure that the passwords-match pipe is defined', () => {
    expect(passwordsMatchPipe).toBeDefined();
  });

  // Tests that when password and passwordConfirmation match, the same CreateUserDto obj that is passed to the pipeline, is returned
  describe('Test Matching Passwords', () => {
    it('should return the same CreateUserDto', () => {
      const dto = buildCreateUserDto();

      expect(passwordsMatchPipe.transform(dto)).toEqual(dto);
    });

    it('should return the same UpdateUserDto', () => {
      const dto = buildUpdateUserDto();

      expect(passwordsMatchPipe.transform(dto)).toEqual(dto);
    });

    it('should return UpdateUserDto if password fields are null', () => {
      const dto = buildUpdateUserDto({
        password: undefined,
        passwordConfirmation: undefined
      });

      expect(passwordsMatchPipe.transform(dto)).toEqual(dto);
    });
  });

  // Tests that when password and passwordConfirmation don't match, a BadRequestException is thrown
  describe('Test Mismatching Passwords', () => {
    it('should throw a Bad Request Exception', () => {
      const dto = buildCreateUserDto({
        passwordConfirmation: 'LETmeiN123%%%tP'
      });

      expect(() =>
        passwordsMatchPipe.transform(dto)
      ).toThrowError(BadRequestException);
      expect(() =>
        passwordsMatchPipe.transform(dto)
      ).toThrowError('Passwords do not match');
    });
  });
});
