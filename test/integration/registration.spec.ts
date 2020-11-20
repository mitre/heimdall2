/// <reference types="cypress" />

import RegistrationPage from '../support/pages/registration.page';
import RegistrationVerifier from '../support/verifiers/registration.verifier';
import ToastVerifier from '../support/verifiers/toast.verifier';
import {CREATE_USER_DTO_TEST_OBJ} from '../../apps/backend/test/constants/users-test.constant';

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
      registrationPage.registerSuccess(CREATE_USER_DTO_TEST_OBJ);
      toastVerifier.toastTextContains('You have successfully registered, please sign in')
      
    });
  });
})
