/// <reference types="cypress" />

import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import DatabaseHelper from '../support/helpers/DatabaseHelper';
import LoginPage from '../support/pages/LoginPage';
import RegistrationPage from '../support/pages/RegistrationPage';
import LoginPageVerifier from '../support/verifiers/LoginPageVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';

context('Login', () => {
  // Pages, verifiers, and modules
  const databaseHelper = new DatabaseHelper();
  const loginPage = new LoginPage();
  const loginPageVerifier = new LoginPageVerifier();
  const registrationPage = new RegistrationPage();
  const toastVerifier = new ToastVerifier();

  // Run before each test
  beforeEach(() => {
    cy.visit('127.0.0.1:3000/login');
    const adminPassword = databaseHelper.createAdmin();
    registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
  });

  // The test
  describe('Login Form', () => {
    it('allows a user to log in to their account', () => {
      loginPageVerifier.loginFormPresent();
      loginPage.loginSuccess(LOGIN_AUTHENTICATION);
      toastVerifier.toastTextContains('You have successfully signed in.');
    });
  });
});
