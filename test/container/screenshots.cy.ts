import 'cypress-wait-until';
import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import UploadModal from '../support/components/UploadModal';
import RegistrationPage from '../support/pages/RegistrationPage';
import ToastVerifier from '../support/verifiers/ToastVerifier';

// Run against the built container image by .github/workflows/build-save-docker.yml with
// supportFile=false. The e2e support file clears the database through /users/clear, which
// only exists in the test-mode backend, and the production image rightly refuses it.
// This is not part of the e2e suite (its specPattern is test/integration); it exists to
// give reviewers a look at what the image serves, so the assertions are minimal.
context('Container screenshots', () => {
  const registrationPage = new RegistrationPage();
  const toastVerifier = new ToastVerifier();
  const uploadModal = new UploadModal();

  beforeEach(() => {
    // Avoid GitHub rate limits from the 'check for updates' call
    cy.intercept('https://api.github.com/repos/mitre/heimdall2/tags', [
      {name: 'v9.9.9'}
    ]);
  });

  it('captures the login page and a loaded sample', () => {
    cy.visit('/login');
    cy.get('#login_button').should('be.visible');
    cy.screenshot('login', {capture: 'viewport'});

    registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
    cy.get('input[name=email]').type(LOGIN_AUTHENTICATION.email);
    cy.get('input[name=password]').type(LOGIN_AUTHENTICATION.password);
    cy.get('#login_button').click();
    toastVerifier.toastTextContains('You have successfully signed in.');
    cy.get('#hide-snackbar').click();

    uploadModal.loadSample('Acme Overlay Example');
    cy.url().should('include', '/results');
    // Let the charts finish animating so the screenshot isn't taken mid-draw
    cy.wait(3000);
    cy.screenshot('results', {capture: 'viewport'});
  });
});
