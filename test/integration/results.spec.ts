/// <reference types="cypress" />

import LoginPage from '../support/pages/login.page';
import ResultsPage from '../support/pages/results.page';
import UploadModal from '../support/components/upload.modal'
import {LOGIN_AUTHENTICATION} from '../../apps/backend/test/constants/users-test.constant';

context('Results', () => {
  // Pages, verifiers, and modules
  const loginPage = new LoginPage();
  const resultsPage = new ResultsPage();
  const uploadModal = new UploadModal();
  // Run before each test
  beforeEach(() => {
    cy.visit('127.0.0.1:3000/login');
    loginPage.loginSuccess(LOGIN_AUTHENTICATION);
  });

  // The test
  describe('Loading a result', () => {
    it('successfully loads and displays a result', () => {
        // Load first sample (typically "Sonarqube Java Heimdall_tools Sample")
        uploadModal.loadFirstSample()
        
    });
  });
})
