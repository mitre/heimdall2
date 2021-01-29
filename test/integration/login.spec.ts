/// <reference types="cypress" />

import {
  BAD_LOGIN_AUTHENTICATION,
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import Dropdown from '../support/components/Dropdown';
import UploadModal from '../support/components/UploadModal';
import LoginPage from '../support/pages/LoginPage';
import RegistrationPage from '../support/pages/RegistrationPage';
import LoginPageVerifier from '../support/verifiers/LoginPageVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';
import UserModalVerifier from '../support/verifiers/UserModalVerifier';

context('Login', () => {
  // Pages, verifiers, and modules
  const dropdown = new Dropdown();
  const loginPage = new LoginPage();
  const loginPageVerifier = new LoginPageVerifier();
  const registrationPage = new RegistrationPage();
  const toastVerifier = new ToastVerifier();
  const uploadModal = new UploadModal();
  const userModalVerifier = new UserModalVerifier();

  // Run before each test
  beforeEach(() => {
    registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
  });

  // The test
  describe('Login Form', () => {
    it('authenticates a user with valid credentials', () => {
      loginPageVerifier.loginFormPresent();
      loginPage.login(LOGIN_AUTHENTICATION);
      toastVerifier.toastTextContains('You have successfully signed in.');
    });
    it('authenticates a github oauth user', () => {
      loginPageVerifier.loginFormPresent();
      loginPage.loginOauth('github');
      // Load first sample
      uploadModal.loadFirstSample();
      // Open the user modal
      dropdown.openUserModal();
      // Make sure all the fields exist
      userModalVerifier.verifyFieldsExist();
    });
    it('fails to authenticate a user with invalid credentials', () => {
      loginPage.login(BAD_LOGIN_AUTHENTICATION);
      toastVerifier.toastTextContains('Incorrect Username or Password');
    });
  });
});
