/// <reference types="cypress" />

import LoginPage from '../support/pages/login.page';
import RegistrationVerifier from '../support/verifiers/registration.verifier';
import ToastVerifier from '../support/verifiers/toast.verifier';
import {LOGIN_AUTHENTICATION} from '../../apps/backend/test/constants/users-test.constant';

context('Registration', () => {
  // Pages, verifiers, and modules
  const loginPage = new LoginPage();
  const registrationVerifier = new RegistrationVerifier();
  const toastVerifier = new ToastVerifier();

  // Run before each test
  beforeEach(() => {
    cy.visit('127.0.0.1:3000/login');
  });

  // The test
  describe('Login Form', () => {
    it('allows a user to log in to their account', () => {
      loginPage.loginSuccess(LOGIN_AUTHENTICATION);
      toastVerifier.toastTextContains('You have successfully signed in.')
      
    });
  });
})
