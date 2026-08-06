import {
  AWS_S3_AUTHENTICATION,
  BAD_AWS_S3_AUTHENTICATION,
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import UploadModal from '../support/components/UploadModal';
import S3Page from '../support/pages/S3Page';
import S3TabVerifier from '../support/verifiers/S3TabVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';

context('s3', () => {
  // Pages, verifiers, and modules
  const uploadModal = new UploadModal();
  const toastVerifier = new ToastVerifier();
  const s3TabVerifier = new S3TabVerifier();
  const s3Page = new S3Page();

  // Run before each test
  beforeEach(() => {
    cy.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
    cy.login(LOGIN_AUTHENTICATION);
    toastVerifier.toastTextContains('You have successfully signed in.');
    cy.get('#hide-snackbar').click();
  });

  // The test
  describe('s3 Form', () => {
    it('authenticates a user with valid s3 basic login credentials', () => {
      uploadModal.switchToTab('s3');
      s3TabVerifier.s3AccountCredentialsPresent();
      s3Page.s3BasicLogin(AWS_S3_AUTHENTICATION);
      cy.wait(5000).then(toastVerifier.toastTextNotContains);
    });

    it('fails to authenticate a s3 user with invalid basic login credentials', () => {
      uploadModal.switchToTab('s3');
      s3TabVerifier.s3AccountCredentialsPresent();
      s3Page.s3BasicLogin(BAD_AWS_S3_AUTHENTICATION);
      toastVerifier.toastTextContains(
        'The provided access token is invalid. Please ensure that it is correct.'
      );
    });
  });
});
