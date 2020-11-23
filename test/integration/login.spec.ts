/// <reference types="cypress" />

import LoginPage from '../support/pages/login.page';
import LoginPageVerifier from '../support/verifiers/login.verifier';
import ToastVerifier from '../support/verifiers/toast.verifier';
import {LOGIN_AUTHENTICATION} from '../../apps/backend/test/constants/users-test.constant';

context('Login', () => {
  // Pages, verifiers, and modules
  const loginPage = new LoginPage();
  const loginPageVerifier = new LoginPageVerifier();
  const toastVerifier = new ToastVerifier();

  // Run before each test
  beforeEach(() => {
    cy.visit('127.0.0.1:3000/login');
  });

  // The test
  describe('Login Form', () => {
    it('allows a user to log in to their account', () => {
      loginPageVerifier.loginFormPresent();
      loginPage.loginSuccess(LOGIN_AUTHENTICATION);
      toastVerifier.toastTextContains('You have successfully signed in.');
    });
  });
})
