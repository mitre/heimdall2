import { PasswordComplexityPipe } from './password-complexity.pipe';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { CREATE_USER_DTO_TEST_OBJ, UPDATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
  UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD }
  from '../../test/test.constants';

describe('PasswordComplexityPipe', () => {
  let passwordComplexityPipe: PasswordComplexityPipe;
  let metaData: ArgumentMetadata;

  beforeEach(() => {
    passwordComplexityPipe = new PasswordComplexityPipe();
  });

  it('should make sure that the passwords-complexity pipe is defined', () => {
    expect(passwordComplexityPipe).toBeDefined();
  });

  describe('Helper Function Tests', () => {
    describe('hasClasses', () => {
      it('should fail because the password length is less than 15 characters and it has all character classes', () => {
        expect(passwordComplexityPipe.hasClasses('$7aB')).toBeFalsy();
      });

      it('should fail because the password does not contain a special character', () => {
        expect(passwordComplexityPipe.hasClasses('Testpasswordwithoutspecialchar7')).toBeFalsy();
      });

      it('should fail because the password does not contain a number', () => {
        expect(passwordComplexityPipe.hasClasses('Testpasswordwithoutnumber$')).toBeFalsy();
      });

      it('should fail because the password does not contain an uppercase letter', () => {
        expect(passwordComplexityPipe.hasClasses('testpasswordwithoutuppercase7$')).toBeFalsy();
      });

      it('should fail because the password does not contain a lowercase letter', () => {
        expect(passwordComplexityPipe.hasClasses('TESTPASSWORDWITHOUTLOWERCASE7$')).toBeFalsy();
      });

      it('should pass because the password has all character classes and is at least 15 characters', () => {
        expect(passwordComplexityPipe.hasClasses('Atestpassword7$')).toBeTruthy();
      });
    });

    describe('noRepeats', () => {
      it('should fail because there is more than 3 consecutive repeating lowercase characters in the password', () => {
        expect(passwordComplexityPipe.noRepeats('aaaa')).toBeFalsy();
      });

      it('should fail because there is more than 3 lowercase characters back-to-back in the password', () => {
        expect(passwordComplexityPipe.noRepeats('test')).toBeFalsy();
      });

      it('should fail because there is more than 3 consecutive repeating uppercase characters in the password', () => {
        expect(passwordComplexityPipe.noRepeats('AAAA')).toBeFalsy();
      });

      it('should fail because there is more than 3 uppercase characters back-to-back in the password', () => {
        expect(passwordComplexityPipe.noRepeats('TEST')).toBeFalsy();
      });

      it('should fail because there is more than 3 consecutive repeating numbers in the password', () => {
        expect(passwordComplexityPipe.noRepeats('7777')).toBeFalsy();
      });

      it('should fail because there is more than 3 numbers back-to-back in the password', () => {
        expect(passwordComplexityPipe.noRepeats('1078')).toBeFalsy();
      });

      it('should fail because there is more than 3 consecutive repeating numbers in the password', () => {
        expect(passwordComplexityPipe.noRepeats('$$$$')).toBeFalsy();
      });

      it('should fail because there is more than 3 special characters back-to-back in the password', () => {
        expect(passwordComplexityPipe.noRepeats('!@#$')).toBeFalsy();
      });

      it('should fail because there is more than 3 consecutive white spaces in the password', () => {
        expect(passwordComplexityPipe.noRepeats('spa    ce')).toBeFalsy();
      });

      it('should pass because the password meets all the minimum requirements', () => {
        expect(passwordComplexityPipe.noRepeats('aaaBBB111$$$')).toBeTruthy();
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
      expect(passwordComplexityPipe.transform(CREATE_USER_DTO_TEST_OBJ, metaData)).toEqual(CREATE_USER_DTO_TEST_OBJ);
    });

    it('should return the same UpdateUserDto', () => {
      expect(passwordComplexityPipe.transform(UPDATE_USER_DTO_TEST_OBJ, metaData)).toEqual(UPDATE_USER_DTO_TEST_OBJ);
    });
  });

  /* Tests that when a password does not meet all the minimum requirements,
    a BadRequestException is thrown */
  describe('Test Invalid Password', () => {
    it('should throw a BadRequestException for CreateUserDto', () => {
      expect(() => passwordComplexityPipe.transform(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD, metaData)).toThrowError(BadRequestException);
      expect(() => passwordComplexityPipe.transform(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD, metaData)).toThrowError('Password does not meet complexity requirements. Passwords are a minimum of 15' +
      ' characters in length. Passwords must contain at least one special character, number, upper-case letter, and' +
      ' lower-case letter. Passwords cannot contain more than three consecutive repeating characters.' +
      ' Passwords cannot contain more than four repeating characters from the same character class.');
    });

    it('should throw a BadRequestException for UpdateUserDto', () => {
      expect(() => passwordComplexityPipe.transform(UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD, metaData)).toThrowError(BadRequestException);
      expect(() => passwordComplexityPipe.transform(UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD, metaData)).toThrowError('Password does not meet complexity requirements. Passwords are a minimum of 15' +
      ' characters in length. Passwords must contain at least one special character, number, upper-case letter, and' +
      ' lower-case letter. Passwords cannot contain more than three consecutive repeating characters.' +
      ' Passwords cannot contain more than four repeating characters from the same character class.');
    });
  });
});
