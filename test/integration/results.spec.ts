/// <reference types="cypress" />

import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD
} from '../../apps/backend/test/constants/users-test.constant';
import Dropdown from '../support/components/Dropdown';
import UploadModal from '../support/components/UploadModal';
import DatabaseHelper from '../support/helpers/DatabaseHelper';
import LoginPage from '../support/pages/LoginPage';
import RegistrationPage from '../support/pages/RegistrationPage';
import ResultsPage from '../support/pages/ResultsPage';
import LoginPageVerifier from '../support/verifiers/LoginPageVerifier';
import ResultsPageVerifier from '../support/verifiers/ResultsPageVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';
import UserModalVerifier from '../support/verifiers/UserModalVerifier';

context('Results', () => {
  // Pages, verifiers, and modules
  const databaseHelper = new DatabaseHelper();
  const dropdown = new Dropdown();
  const loginPage = new LoginPage();
  const loginPageVerifier = new LoginPageVerifier();
  const registrationPage = new RegistrationPage();
  const resultsPageVerifier = new ResultsPageVerifier();
  const resultsPage = new ResultsPage();
  const toastVerifier = new ToastVerifier();
  const uploadModal = new UploadModal();
  const userModalVerifier = new UserModalVerifier();
  // Run before each test
  beforeEach(() => {
    databaseHelper.clear();
    registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('127.0.0.1:3000/login');
    loginPage.login(LOGIN_AUTHENTICATION);
  });

  // The test
  describe('Results', () => {
    it('displays correct data for the first sample', () => {
      // Load first sample
      uploadModal.loadFirstSample();
      // Open profile info
      resultsPage.openProfileInfo();
      // Make results data is correct
      resultsPageVerifier.resultsDataCorrect();
      // Scroll controlls into view
      cy.scrollTo('bottom');
    });
  });

  describe('User Modal', () => {
    it('successfully opens and displays the user modal and allows users to change their data', () => {
      // Load first sample (typically "Sonarqube Java Heimdall_tools Sample")
      uploadModal.loadFirstSample();
      // Open the user modal
      dropdown.openUserModal();
      // Make sure all the fields exist
      userModalVerifier.verifyFieldsExist();
      // Change their user data
      dropdown.changeUserData(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD);
      // Check for success toast
      toastVerifier.toastTextContains('User updated successfully.');
    });
  });

  describe('Logout Button', () => {
    it('sucessfully logs a user out', () => {
      loginPage.login(LOGIN_AUTHENTICATION);
      toastVerifier.toastTextContains('You have successfully signed in.');
      dropdown.logout();
      loginPageVerifier.loginFormPresent();
    });
  });
});
