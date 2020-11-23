/// <reference types="cypress" />

import LoginPage from '../support/pages/login.page';
// import ResultsPage from '../support/pages/results.page';
import UploadModal from '../support/components/upload.modal';
import UserModal from '../support/components/user.modal';
import UserModalVerifier from '../support/verifiers/user.modal.verifier';
import {LOGIN_AUTHENTICATION} from '../../apps/backend/test/constants/users-test.constant';

context('Results', () => {
  // Pages, verifiers, and modules
  const loginPage = new LoginPage();
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
  });

  describe('User Modal', () => {
    it('successfully opens and displays the user modal', () => {
      // Load first sample (typically "Sonarqube Java Heimdall_tools Sample")
      uploadModal.loadFirstSample();
      // Open the user modal
      userModal.openUserModal();
      // Make sure all the fields exist
      userModalVerifier.verifyFieldsExist();
    })
  })
})
