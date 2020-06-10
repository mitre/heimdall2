import { PasswordsMatchPipe } from './passwords-match.pipe';
import { ArgumentMetadata, Body, BadRequestException } from '@nestjs/common';
import { CREATE_USER_DTO_TEST_OBJ, CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS } from '../../test/test.constants';

describe('PasswordsMatchPipe', () => {
  let passwordsMatchPipe: PasswordsMatchPipe;
  let metaData: ArgumentMetadata;

  beforeEach(() => {
    passwordsMatchPipe = new PasswordsMatchPipe();
  });

  /* Tests that when password and passwordConfirmation match,
   the same CreateUserDto obj that is passed to the pipeline, is returned */
  describe('Test Matching Passwords', () => {
    it('should return the same CreateUserDto', () => {
      expect(passwordsMatchPipe).toBeDefined();
      expect(passwordsMatchPipe.transform(CREATE_USER_DTO_TEST_OBJ, metaData)).toEqual(CREATE_USER_DTO_TEST_OBJ);
    });
  });

  /* Tests that when password and passwordConfirmation don't match,
    a BadRequestException is thrown */
  describe('Test Mismatching Passwords', () => {
    it('should throw a Bad Request Exception', () => {
      expect(passwordsMatchPipe).toBeDefined();
      expect(() => passwordsMatchPipe.transform(CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS, metaData)).toThrowError(BadRequestException);
      expect(() => passwordsMatchPipe.transform(CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS, metaData)).toThrowError('Passwords do not match');
    });
  });
});
