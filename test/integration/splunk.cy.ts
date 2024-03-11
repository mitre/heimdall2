import {
  BAD_SPLUNK_AUTHENTICATION,
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION,
  SPLUNK_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import UploadModal from '../support/components/UploadModal';
import SplunkPage from '../support/pages/SplunkPage';
import SplunkTabVerifier from '../support/verifiers/SplunkTabVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';

context('Splunk', () => {
  // Pages, verifiers, and modules
  const uploadModal = new UploadModal();
  const toastVerifier = new ToastVerifier();
  const splunkTabVerifier = new SplunkTabVerifier();
  const splunkPage = new SplunkPage();

  // Run before each test
  beforeEach(() => {
    cy.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
    cy.login(LOGIN_AUTHENTICATION);
    toastVerifier.toastTextContains('You have successfully signed in.');
    cy.get('#hide-snackbar').click();
  });

  // The test
  describe('Splunk Form', () => {
    it('authenticates a user with valid Splunk credentials', () => {
      uploadModal.switchToTab('splunk');
      splunkTabVerifier.splunkPresent();
      splunkPage.splunkLogin(SPLUNK_AUTHENTICATION);
      toastVerifier.toastTextContains('You have successfully signed in');
    });

    it('fails to authenticate a Splunk user with invalid credentials', () => {
      uploadModal.switchToTab('splunk');
      splunkTabVerifier.splunkPresent();
      splunkPage.splunkLogin(BAD_SPLUNK_AUTHENTICATION);
      toastVerifier.toastTextContains(
        'Error: Failed to login - Incorrect username or password'
      );
    });
  });
});
