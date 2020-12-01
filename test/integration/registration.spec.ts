/// <reference types="cypress" />

import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
} from '../../apps/backend/test/constants/users-test.constant';
import DatabaseHelper from '../support/helpers/DatabaseHelper';
import RegistrationPage from '../support/pages/RegistrationPage';
import RegistrationVerifier from '../support/verifiers/RegistrationPageVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';

context('Registration', () => {
  // Pages, verifiers, and modules
  const databaseHelper = new DatabaseHelper();
  const registrationPage = new RegistrationPage();
  const registrationVerifier = new RegistrationVerifier();
  const toastVerifier = new ToastVerifier();

  // Run before each test
  beforeEach(() => {
    databaseHelper.createAdmin();
    cy.visit('127.0.0.1:3000/signup');
  });

  // The test
  describe('Registration Form', () => {
    it('allows a user to create an account', () => {
      registrationVerifier.registerFormPresent();
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
      toastVerifier.toastTextContains(
        'You have successfully registered, please sign in'
      );
    });

    it('rejects emails that already exist', async () => {
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
      toastVerifier.toastTextContains('Email must be unique');
    });

    it('rejects a weak password', () => {
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD);
      toastVerifier.toastTextContains(
        'Password does not meet complexity requirements'
      );
    });

    it('rejects mismatching passwords', () => {
      registrationPage.registerNoSubmit(
        CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
      );
      registrationVerifier.registerButtonDisabled();
    });
  });
});
