import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import Sidebar from '../support/components/Sidebar';
import UploadModal from '../support/components/UploadModal';
import DatabasePage from '../support/pages/DatabasePage';
import DataTableVerifier from '../support/verifiers/DataTableVerifier';
import ResultsPageVerifier from '../support/verifiers/ResultsPageVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';

context('Database results', () => {
  const uploadModal = new UploadModal();
  const sidebar = new Sidebar();
  const toastVerifier = new ToastVerifier();
  const dataTableVerifier = new DataTableVerifier();
  const resultsPageVerifier = new ResultsPageVerifier();
  const databasePage = new DatabasePage();
  const sampleToLoad = 'Acme Overlay Example';

  // Run before each test
  beforeEach(() => {
    cy.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
    cy.login(LOGIN_AUTHENTICATION);
  });

  describe('CRUD', () => {
    it('allows a user to save a result', () => {
      uploadModal.loadSample(sampleToLoad);
      sidebar.open();
      sidebar.save(sampleToLoad);
      toastVerifier.toastTextContains('File saved successfully');
      uploadModal.activate();
      uploadModal.switchToTab('database');
      dataTableVerifier.verifyTextPresent(sampleToLoad);
    });

    it('allows a user to load a result', () => {
      uploadModal.loadSample(sampleToLoad);
      sidebar.open();
      sidebar.save(sampleToLoad);
      sidebar.close(sampleToLoad);
      uploadModal.activate();
      uploadModal.loadFromDatabase(sampleToLoad);
      resultsPageVerifier.resultsFilenameCorrect(sampleToLoad);
    });

    it('allows a user to update a result', () => {
      const updatedName = 'Updated Filename';
      uploadModal.loadSample(sampleToLoad);
      sidebar.open();
      sidebar.save(sampleToLoad);
      sidebar.close(sampleToLoad);
      uploadModal.activate();
      uploadModal.switchToTab('database');
      databasePage.updateResultName(sampleToLoad, updatedName);
      dataTableVerifier.verifyTextPresent(updatedName);
    });

    it('allows a user to delete a result', () => {
      uploadModal.loadSample(sampleToLoad);
      sidebar.open();
      sidebar.save(sampleToLoad);
      sidebar.close(sampleToLoad);
      uploadModal.activate();
      uploadModal.switchToTab('database');
      databasePage.deleteResult(sampleToLoad);
      dataTableVerifier.verifyTextPresent('No data available');
    });
  });
});
