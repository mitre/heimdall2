import {ArgumentMetadata, BadRequestException} from '@nestjs/common';
import {
  UPDATE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD,
  UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS
} from '../../test/constants/users-test.constant';
import {PasswordChangePipe} from './password-change.pipe';

describe('PasswordChangePipe', () => {
  let passwordChangePipe: PasswordChangePipe;
  let metaData: ArgumentMetadata;

  beforeEach(() => {
    passwordChangePipe = new PasswordChangePipe();
  });

  it('should make sure that the passwords-match pipe is defined', () => {
    expect(passwordChangePipe).toBeDefined();
  });

  // Tests the classesChanged Helper Function
  describe('classesChanged Helper Function', () => {
    it('should pass', () => {
      expect(
        passwordChangePipe.classesChanged('Totally$Different199', 'Letmein123@')
      ).toBeTruthy();
    });

    it('should fail because both passwords have the same uppercase letter(s) in the same order', () => {
      expect(
        passwordChangePipe.classesChanged('abc$LghE17', 'LEtmein123')
      ).toBeFalsy();
    });

    it('should pass because both passwords have the same uppercase letter(s) but in a different order', () => {
      expect(
        passwordChangePipe.classesChanged('abc$EghL17', 'LEtmein123')
      ).toBeTruthy();
    });

    it('should fail because both passwords have the same lowercase letter(s) in the same order', () => {
      expect(
        passwordChangePipe.classesChanged('ABCDe$PQRSt', 'LetMEIN123')
      ).toBeFalsy();
    });

    it('should pass because both passwords have the same lowercase letter(s) but in a different order', () => {
      expect(
        passwordChangePipe.classesChanged('ABCDt$PQRSe', 'LetMEIN123')
      ).toBeTruthy();
    });

    it('should fail because both passwords have the same number(s) in the same order', () => {
      expect(
        passwordChangePipe.classesChanged('ab0c$DEF7', '0ABCdef7')
      ).toBeFalsy();
    });

    it('should pass because both passwords have the same number(s) but in a different order', () => {
      expect(
        passwordChangePipe.classesChanged('ab7c$4DEF0', '0ABCdef7')
      ).toBeTruthy();
    });

    it('should pass because both passwords have the same special character(s) but in a different order', () => {
      expect(
        passwordChangePipe.classesChanged('ab$c D1EF&', '&ABCdef7$')
      ).toBeTruthy();
    });

    it('should fail because both passwords have the same special character(s) but in the same order', () => {
      expect(
        passwordChangePipe.classesChanged('&abc D1EF$', '&ABCdef7$')
      ).toBeFalsy();
    });

    it('should fail because both passwords are the same', () => {
      expect(
        passwordChangePipe.classesChanged('Letmein123$', 'Letmein123$')
      ).toBeFalsy();
    });
  });

  /* Tests that when the user wants to update their password,
    the Levenshtein Distance of their new password and old password is > 8
    and at least 4 character classes are changed (2nd part is mocked out due
    to the classesChanged function being tested above) */
  describe('Test Valid Password Changes', () => {
    it('should return the same UpdateUserDto', () => {
      jest
        .spyOn(passwordChangePipe, 'classesChanged')
        .mockReturnValueOnce(true);
      expect(
        passwordChangePipe.transform(
          UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD,
          metaData
        )
      ).toEqual(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD);
    });

    it('should return UpdateUserDto if password fields are null', () => {
      jest
        .spyOn(passwordChangePipe, 'classesChanged')
        .mockReturnValueOnce(true);
      expect(
        passwordChangePipe.transform(
          UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
          metaData
        )
      ).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS);
    });
  });

  /* Tests that when a user tries to update their password with a new password
    that's Levenshtein Distance is < 8, it throws a BadRequestException */
  describe('Test Invalid Password Changes', () => {
    it('should throw a BadRequestException', () => {
      expect(() =>
        passwordChangePipe.transform(UPDATE_USER_DTO_TEST_OBJ, metaData)
      ).toThrowError(BadRequestException);
      expect(() =>
        passwordChangePipe.transform(UPDATE_USER_DTO_TEST_OBJ, metaData)
      ).toThrowError(
        'A minimum of four character classes must be changed when updating a password.' +
          ' A minimum of eight of the total number of characters must be changed when updating a password.'
      );
    });
  });
});
