import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD
} from '../../apps/backend/test/constants/users-test.constant';
import Dropdown from '../support/components/Dropdown';
import UploadModal from '../support/components/UploadModal';
import ResultsPage from '../support/pages/ResultsPage';
import ResultsPageVerifier from '../support/verifiers/ResultsPageVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';
import UserModalVerifier from '../support/verifiers/UserModalVerifier';

context('Results', () => {
  // Pages, verifiers, and modules
  const dropdown = new Dropdown();
  const resultsPageVerifier = new ResultsPageVerifier();
  const resultsPage = new ResultsPage();
  const toastVerifier = new ToastVerifier();
  const uploadModal = new UploadModal();
  const userModalVerifier = new UserModalVerifier();

  // Run before each test
  beforeEach(() => {
    cy.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
    cy.login(LOGIN_AUTHENTICATION);
    toastVerifier.toastTextContains('You have successfully signed in.');
    cy.get('#hide-snackbar').click();
  });

  // The test
  describe('Results', () => {
    it('displays correct data for the Acme Overlay Example sample', () => {
      // Load first sample
      uploadModal.loadSample('Acme Overlay Example');
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
});
