import {validators} from '@heimdall/password-complexity';
import {ArgumentMetadata, BadRequestException} from '@nestjs/common';
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
  UPDATE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD,
  UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS
} from '../../test/constants/users-test.constant';
import {
  PasswordComplexityPipe,
  validatePassword
} from './password-complexity.pipe';

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

  /* Tests the complexity of a user's password and that when it meets the requirements of:
    15 characters or longer, at least 1 uppercase letter, lowercase letter, number, special character,
    the password meets the requirements of not containing more than three consecutive repeating
    characters, and it contains no more than four repeating characters from the same character class,
    the same dto object will be returned*/
  describe('Test Valid Password', () => {
    it('should return the same CreateUserDto', () => {
      expect(
        passwordComplexityPipe.transform(CREATE_USER_DTO_TEST_OBJ)
      ).toEqual(CREATE_USER_DTO_TEST_OBJ);
    });

    it('should return the same UpdateUserDto', () => {
      expect(
        passwordComplexityPipe.transform(UPDATE_USER_DTO_TEST_OBJ)
      ).toEqual(UPDATE_USER_DTO_TEST_OBJ);
    });

    it('should return UpdateUserDto if password fields are null', () => {
      expect(
        passwordComplexityPipe.transform(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS)
      ).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS);
    });
  });

  /* Tests that when a password does not meet all the minimum requirements,
    a BadRequestException is thrown */
  describe('Test Invalid Password', () => {
    it('should throw a BadRequestException for CreateUserDto with missing password', () => {
      expect(() =>
        passwordComplexityPipe.transform(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD)
      ).toThrowError(BadRequestException);
      expect(() =>
        passwordComplexityPipe.transform(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD)
      ).toThrowError('Password must be of type string');
    });

    it('should throw a BadRequestException for UpdateUserDto with missing password', () => {
      expect(() =>
        passwordComplexityPipe.transform(UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD)
      ).toThrowError(BadRequestException);
      expect(() =>
        passwordComplexityPipe.transform(UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD)
      ).toThrowError('Password must be of type string');
    });
  });
});
