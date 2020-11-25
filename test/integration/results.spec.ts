/// <reference types="cypress" />

import {
  LOGIN_AUTHENTICATION,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD
} from '../../apps/backend/test/constants/users-test.constant';
import UploadModal from '../support/components/UploadModal';
import UserModal from '../support/components/UserModal';
import LoginPage from '../support/pages/LoginPage';
import ResultsPageVerifier from '../support/verifiers/ResultsPageVerifier';
import UserModalVerifier from '../support/verifiers/UserModalVerifier';

context('Results', () => {
  // Pages, verifiers, and modules
  const loginPage = new LoginPage();
  const resultsPageVerifier = new ResultsPageVerifier();
  const uploadModal = new UploadModal();
  const userModal = new UserModal();
  const userModalVerifier = new UserModalVerifier();
  // Run before each test
  beforeEach(() => {
    cy.visit('127.0.0.1:3000/login');
    loginPage.loginSuccess(LOGIN_AUTHENTICATION);
  });

  // The test
  describe('Results', () => {
    it('successfully loads and displays a result', () => {
      // Load first sample (typically "Sonarqube Java Heimdall_tools Sample")
      uploadModal.loadFirstSample();
    });
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
      // toastVerifier.toastTextContains('')
    });
  });
});
