import {BadRequestException} from '@nestjs/common';
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS,
  UPDATE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS
} from '../../test/constants/users-test.constant';
import {PasswordsMatchPipe} from './passwords-match.pipe';

describe('PasswordsMatchPipe', () => {
  let passwordsMatchPipe: PasswordsMatchPipe;

  beforeEach(() => {
    passwordsMatchPipe = new PasswordsMatchPipe();
  });

  it('should make sure that the passwords-match pipe is defined', () => {
    expect(passwordsMatchPipe).toBeDefined();
  });

  /* Tests that when password and passwordConfirmation match,
   the same CreateUserDto obj that is passed to the pipeline, is returned */
  describe('Test Matching Passwords', () => {
    it('should return the same CreateUserDto', () => {
      expect(passwordsMatchPipe.transform(CREATE_USER_DTO_TEST_OBJ)).toEqual(
        CREATE_USER_DTO_TEST_OBJ
      );
    });

    it('should return the same UpdateUserDto', () => {
      expect(passwordsMatchPipe.transform(UPDATE_USER_DTO_TEST_OBJ)).toEqual(
        UPDATE_USER_DTO_TEST_OBJ
      );
    });

    it('should return UpdateUserDto if password fields are null', () => {
      expect(
        passwordsMatchPipe.transform(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS)
      ).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS);
    });
  });

  /* Tests that when password and passwordConfirmation don't match,
    a BadRequestException is thrown */
  describe('Test Mismatching Passwords', () => {
    it('should throw a Bad Request Exception', () => {
      expect(() =>
        passwordsMatchPipe.transform(
          CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
        )
      ).toThrowError(BadRequestException);
      expect(() =>
        passwordsMatchPipe.transform(
          CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
        )
      ).toThrowError('Passwords do not match');
    });
  });
});
