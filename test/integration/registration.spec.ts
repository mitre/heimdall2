/// <reference types="cypress" />

import RegistrationPage from '../support/pages/registration.page';
import RegistrationVerifier from '../support/verifiers/registration.verifier';
import ToastVerifier from '../support/verifiers/toast.verifier';
import {CREATE_USER_DTO_TEST_OBJ, CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD} from '../../apps/backend/test/constants/users-test.constant';

context('Registration', () => {
  // Pages, verifiers, and modules
  const registrationPage = new RegistrationPage();
  const registrationVerifier = new RegistrationVerifier();
  const toastVerifier = new ToastVerifier();

  // Run before each test
  beforeEach(() => {
    cy.visit('127.0.0.1:3000/signup');
  });

  // The test
  describe('Registration Form', () => {
    it('allows a user to create an account', () => {
      registrationVerifier.registerFormPresent();
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
      toastVerifier.toastTextContains('You have successfully registered, please sign in')
    });

    it('fails to allow a user to create an account with a weak password', () => {
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD);
      toastVerifier.toastTextContains('Password does not meet complexity requirements. Passwords are a minimum of 15 characters in length. Passwords must contain at least one special character, number, upper-case letter, and lower-case letter. Passwords cannot contain more than three consecutive repeating characters. Passwords cannot contain more than four repeating characters from the same character class.')
    })
  });
})
