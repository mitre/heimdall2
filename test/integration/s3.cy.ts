import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import UploadModal from '../support/components/UploadModal';
import S3Page from '../support/pages/S3Page';
import ResultsPageVerifier from '../support/verifiers/ResultsPageVerifier';
import S3TabVerifier from '../support/verifiers/S3TabVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';

context('S3', () => {
  const uploadModal = new UploadModal();
  const toastVerifier = new ToastVerifier();
  const s3Page = new S3Page();
  const s3TabVerifier = new S3TabVerifier();
  const resultsPageVerifier = new ResultsPageVerifier();

  beforeEach(() => {
    cy.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
    cy.login(LOGIN_AUTHENTICATION);
    toastVerifier.toastTextContains('You have successfully signed in.');
    cy.get('#hide-snackbar').click();
  });

  describe('S3 Form', () => {
    it('lists a file from a custom S3 endpoint', () => {
      uploadModal.switchToTab('s3');
      s3TabVerifier.s3Present();
      s3Page.loginWithDirectCredentials({
        accessKey: 'myaccesskey',
        secretKey: 'mysecretkey',
        endpoint: 'http://127.0.0.1:7070'
      });
      s3Page.loadBucket('mybucket');
      s3TabVerifier.fileIsListed('nessus-hdf.json');
      s3Page.loadFile('nessus-hdf.json');
      resultsPageVerifier.resultsFilenameCorrect('nessus-hdf.json');
    });
  });
});
