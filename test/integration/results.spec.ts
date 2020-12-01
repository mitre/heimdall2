/// <reference types="cypress" />

import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD
} from '../../apps/backend/test/constants/users-test.constant';
import UploadModal from '../support/components/UploadModal';
import UserModal from '../support/components/UserModal';
import DatabaseHelper from '../support/helpers/DatabaseHelper';
import LoginPage from '../support/pages/LoginPage';
import RegistrationPage from '../support/pages/RegistrationPage';
import ResultsPageVerifier from '../support/verifiers/ResultsPageVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';
import UserModalVerifier from '../support/verifiers/UserModalVerifier';

context('Results', () => {
  // Pages, verifiers, and modules
  const databaseHelper = new DatabaseHelper();
  const loginPage = new LoginPage();
  const registrationPage = new RegistrationPage();
  const resultsPageVerifier = new ResultsPageVerifier();
  const toastVerifier = new ToastVerifier();
  const uploadModal = new UploadModal();
  const userModal = new UserModal();
  const userModalVerifier = new UserModalVerifier();
  // Run before each test
  beforeEach(() => {
    const adminPassword = databaseHelper.createAdmin();
    registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('127.0.0.1:3000/login');
    loginPage.loginSuccess(LOGIN_AUTHENTICATION);
  });

  // The test
  describe('Results', () => {
    it('displays correct data for the first sample', () => {
      uploadModal.loadFirstSample();
      resultsPageVerifier.resultsDataCorrect();
    });
  });

  describe('User Modal', () => {
    it('successfully opens and displays the user modal and allows users to change their data', () => {
      // Load first sample (typically "Sonarqube Java Heimdall_tools Sample")
      uploadModal.loadFirstSample();
      // Open the user modal
      userModal.openUserModal();
      // Make sure all the fields exist
      userModalVerifier.verifyFieldsExist();
      // Change their user data
      userModal.changeUserData(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD);
      // Check for success toast
      toastVerifier.toastTextContains('User updated successfully.');
    });
  });
});
