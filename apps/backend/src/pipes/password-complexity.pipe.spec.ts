import {validators} from '@heimdall/password-complexity';
import {BadRequestException} from '@nestjs/common';
import {beforeEach, describe, expect, it} from 'vitest';
import type {CreateUserDto} from '../users/dto/create-user.dto';
import type {UpdateUserDto} from '../users/dto/update-user.dto';
import {
  PasswordComplexityPipe,
  validatePassword
} from './password-complexity.pipe';

function buildCreateUserDto(
  overrides: Partial<CreateUserDto> = {}
): CreateUserDto {
  return {
    email: `complexity-${Date.now()}@pipe.test`,
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
    email: `complexity-update-${Date.now()}@pipe.test`,
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

describe('PasswordComplexityPipe', () => {
  let passwordComplexityPipe: PasswordComplexityPipe;

  beforeEach(() => {
    passwordComplexityPipe = new PasswordComplexityPipe();
  });

  it('should make sure that the passwords-complexity pipe is defined', () => {
    expect(passwordComplexityPipe).toBeDefined();
  });

  describe('Helper Function Tests', () => {
    describe('checkLength', () => {
      it('should fail because the password has less than 15 characters', () => {
        expect(validatePassword('ShortPassword')).toContain(validators[0].name);
      });
      it('should pass because the password has more than 15 characters', () => {
        expect(validatePassword('NotAShortPassword')).not.toContain(
          validators[0].name
        );
      });
    });

    describe('hasClasses', () => {
      it('should fail because the password does not contain a special character', () => {
        expect(validatePassword('Testpasswordwithoutspecialchar7')).toContain(
          validators[1].name
        );
      });

      it('should fail because the password does not contain a number', () => {
        expect(validatePassword('Testpasswordwithoutanumber')).toContain(
          validators[1].name
        );
      });

      it('should fail because the password does not contain an uppercase letter', () => {
        expect(validatePassword('testpasswordwithoutuppercase7$')).toContain(
          validators[1].name
        );
      });

      it('should fail because the password does not contain a lowercase letter', () => {
        expect(validatePassword('TESTPASSWORDWITHOUTLOWERCASE7$')).toContain(
          validators[1].name
        );
      });

      it('should pass because the password has all character classes and is at least 15 characters', () => {
        expect(validatePassword('Atestpassword7$')).not.toContain(
          validators[1].name
        );
      });
    });

    describe('noRepeats', () => {
      it('should fail because there is more than 3 consecutive repeating lowercase characters in the password', () => {
        expect(validatePassword('aaaa')).toContain(validators[2].name);
      });

      it('should fail because there is more than 3 lowercase characters back-to-back in the password', () => {
        expect(validatePassword('test')).toContain(validators[2].name);
      });

      it('should fail because there is more than 3 consecutive repeating uppercase characters in the password', () => {
        expect(validatePassword('AAAA')).toContain(validators[2].name);
      });

      it('should fail because there is more than 3 uppercase characters back-to-back in the password', () => {
        expect(validatePassword('TEST')).toContain(validators[2].name);
      });

      it('should fail because there is more than 3 consecutive repeating numbers in the password', () => {
        expect(validatePassword('7777')).toContain(validators[2].name);
      });

      it('should fail because there is more than 3 numbers back-to-back in the password', () => {
        expect(validatePassword('1078')).toContain(validators[2].name);
      });

      it('should fail because there is more than 3 consecutive repeating numbers in the password', () => {
        expect(validatePassword('$$$$')).toContain(validators[2].name);
      });

      it('should fail because there is more than 3 special characters back-to-back in the password', () => {
        expect(validatePassword('!@#$')).toContain(validators[2].name);
      });

      it('should fail because there is more than 3 consecutive white spaces in the password', () => {
        expect(validatePassword('spa    ce')).toContain(validators[2].name);
      });

      it('should pass because the password meets all the minimum requirements', () => {
        expect(validatePassword('aaaBBB111$$$')).not.toContain(
          validators[2].name
        );
      });
    });
  });

  // Tests the complexity of a user's password and that when it meets the requirements of: 15 characters or longer, at least 1 uppercase letter, lowercase letter, number, special character, the password meets the requirements of not containing more than three consecutive repeating characters, and it contains no more than four repeating characters from the same character class, the same dto object will be returned
  describe('Test Valid Password', () => {
    it('should return the same CreateUserDto', () => {
      const dto = buildCreateUserDto();

      expect(passwordComplexityPipe.transform(dto)).toEqual(dto);
    });

    it('should return the same UpdateUserDto', () => {
      const dto = buildUpdateUserDto();

      expect(passwordComplexityPipe.transform(dto)).toEqual(dto);
    });

    it('should return UpdateUserDto if password fields are null', () => {
      const dto = buildUpdateUserDto({
        password: undefined,
        passwordConfirmation: undefined
      });

      expect(passwordComplexityPipe.transform(dto)).toEqual(dto);
    });
  });

  // Tests that when a password does not meet all the minimum requirements, a BadRequestException is thrown
  describe('Test Invalid Password', () => {
    it('should throw a BadRequestException for CreateUserDto with missing password', () => {
      const dto = buildCreateUserDto({password: undefined});

      expect(() =>
        passwordComplexityPipe.transform(dto)
      ).toThrowError(BadRequestException);
      expect(() =>
        passwordComplexityPipe.transform(dto)
      ).toThrowError('Password must be of type string');
    });

    it('should throw a BadRequestException for UpdateUserDto with missing password', () => {
      const dto = buildUpdateUserDto({password: undefined});

      expect(() =>
        passwordComplexityPipe.transform(dto)
      ).toThrowError(BadRequestException);
      expect(() =>
        passwordComplexityPipe.transform(dto)
      ).toThrowError('Password must be of type string');
    });
  });
});
