import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD
} from '../../apps/backend/test/constants/users-test.constant';
import Dropdown from '../support/components/Dropdown';
import Sidebar from '../support/components/Sidebar';
import UploadModal from '../support/components/UploadModal';
import ChecklistPage from '../support/pages/ChecklistPage';
import ChecklistPageVerifier from '../support/verifiers/ChecklistPageVerifier';
import SidebarVerifier from '../support/verifiers/SidebarVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';
import UserModalVerifier from '../support/verifiers/UserModalVerifier';

context('Checklist', () => {
  // Pages, verifiers, and modules
  const dropdown = new Dropdown();
  const checklistPageVerifier = new ChecklistPageVerifier();
  const checklistPage = new ChecklistPage();
  const toastVerifier = new ToastVerifier();
  const uploadModal = new UploadModal();
  const userModalVerifier = new UserModalVerifier();
  const sidebar = new Sidebar();
  const sidebarVerifier = new SidebarVerifier();
  const checklistFile = 'RHEL 8 Checklist';

  // Run before each test
  beforeEach(() => {
    cy.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
    cy.login(LOGIN_AUTHENTICATION);
    toastVerifier.toastTextContains('You have successfully signed in.');
    cy.get('#hide-snackbar').click();
  });

  // The test
  describe('Sidebar', () => {
    // Passed
    it.skip('has the sidebar open by default after selecting a CKL file', () => {
      const checklistFile = 'RHEL 8 Checklist';
      uploadModal.loadSample(checklistFile);
      sidebarVerifier.isSidebarOpen();
      sidebarVerifier.isFileLoadedUnderDropdown('Checklists', checklistFile);
    });

    // Passed
    it.skip('can unload and reload files under the correct dropdowns', () => {
      // 3. Is the file unloadable and reloadable? Can a non-checklist file be loaded and seen that it is not under the Checklists dropdown?
      uploadModal.loadSample(checklistFile);
      sidebar.closeFile(checklistFile);
      sidebarVerifier.isFileNotLoadedUnderDropdown('Checklists', checklistFile);
      uploadModal.activate();
      uploadModal.loadSample(checklistFile);
    });

    // Passed
    it.skip('can save the CKL file and export it to HDF', () => {
      // TODO: modify the file first and then do the saving stuff
      // 4. Is the file saveable to HDF? (What does this mean?)
      uploadModal.loadSample(checklistFile);
      sidebar.saveFileToHdf(checklistFile);
      sidebar.exportFileToHdf();
      cy.readFile(
        `./cypress/downloads/${checklistFile.replace(/ /g, '_')}.json`
      )
        .its('profiles[0].title')
        .should(
          'eq',
          'Red Hat Enterprise Linux 8 Security Technical Implementation Guide'
        );
    });

    // Passed
    it.skip('can toggle common filters', () => {
      uploadModal.loadSample(checklistFile);

      // Nothing is toggled
      checklistPageVerifier.hasMaximalNumberOfRules();

      // Passed
      sidebar.togglePassed();
      checklistPageVerifier.doesNotHaveMaximalNumberOfRules();
      sidebar.togglePassed();

      // Failed
      sidebar.toggleFailed();
      checklistPageVerifier.doesNotHaveMaximalNumberOfRules();
      sidebar.toggleFailed();

      // Not applicable
      sidebar.toggleNotApplicable();
      checklistPageVerifier.doesNotHaveMaximalNumberOfRules();
      sidebar.toggleNotApplicable();

      // Not reviewed
      sidebar.toggleNotReviewed();
      checklistPageVerifier.doesNotHaveMaximalNumberOfRules();
      sidebar.toggleNotReviewed();

      // All control statuses
      sidebar.togglePassed();
      sidebar.toggleFailed();
      sidebar.toggleNotApplicable();
      sidebar.toggleNotReviewed();
      checklistPageVerifier.hasMaximalNumberOfRules();

      // All control statuses + Low
      sidebar.toggleLow();
      checklistPageVerifier.doesNotHaveMaximalNumberOfRules();
      sidebar.toggleLow();

      // All control statuses + medium
      sidebar.toggleMedium();
      checklistPageVerifier.doesNotHaveMaximalNumberOfRules();
      sidebar.toggleMedium();

      // All control statuses + high
      sidebar.toggleHigh();
      checklistPageVerifier.doesNotHaveMaximalNumberOfRules();
      sidebar.toggleHigh();

      // All control statuses + critical
      sidebar.toggleCritical();
      checklistPageVerifier.doesNotHaveMaximalNumberOfRules();
      sidebar.toggleCritical();

      // All control statuses and severities
      sidebar.toggleLow();
      sidebar.toggleMedium();
      sidebar.toggleHigh();
      sidebar.toggleCritical();
      checklistPageVerifier.hasMaximalNumberOfRules();

      // All severities
      sidebar.togglePassed();
      sidebar.toggleFailed();
      sidebar.toggleNotApplicable();
      sidebar.toggleNotReviewed();
      checklistPageVerifier.hasMaximalNumberOfRules();
    });

    it.skip('can apply category filters properly', () => {
      uploadModal.loadSample(checklistFile);
      // 7. Do the filter keywords work? What if we try invalid inputs and keywords?
      sidebar.filterKeywords();
      checklistPageVerifier.filteringKeywordsWorks();
      // 8. Top-navigation bar: type in some query string, like the keyword "vendor". Is this reflected in the sidebar? If so, look for its row under "Selected Filters" and remove it as a keyword. --- this might not be a Checklist test but a Sidebar test. TODO: maybe make a Sidebar and top-nav bar test per each page since they're both found on each page.
      // 9. Sidebar filter: add a negated filter. Correct number of results? No?
      // 10. Try to add a filter that already exists. Does it get added? More than 1 filter, or no?
    });

    it.skip('can apply checklist filters properly', () => {
      uploadModal.loadSample(checklistFile);
      //
    });
  });

  describe.skip('Checklist', () => {
    it('can toggle checklist rule columns properly', () => {
      // 11. Close the sidebar. Are the checklist table dropdown checkboxes clickable? Do they work?
    });

    it('has a real NIST tag URL', () => {
      // 12. Click the second rule. Does the NIST tag URL lead to a real webpage? - Does that webpage refer to the NIST tag? Otherwise broken URL test.
    });

    it('can edit the technology area', () => {
      // 13. Open the sidebar again. Open the technology area modal. Select a value. Clear it. Select a different one. Close it by clicking the close button.
    });

    it('can edit the target data', () => {
      // 14. Open the target data modal. Select a value. Clear it. Select a different one. Close it by clicking out of the modal (like the Sidebar).
    });

    it('can edit the status, severity, type a justification, modify finding details, and modify comments', () => {
      // 15. Modify this rule's status, severity, and type a justification, modify finding details, comments. See that it persists when clicking a different rule and clicking back.
    });

    it('can edit the previous types of data for another rule', () => {
      // 16. Repeat step 15 for the next rule. See that it persists when clicking a different rule and clicking back.
    });

    it('can load and modify another CKL file', () => {
      // 17. Load another checklist, "Three Stig Checklist". Then select "Clean RHEL 8 Checklist" again.
      // 18. Modify the first rule in this checklist. Click "Export" and then "Export as DISA Checklist", then select the checklist.
    });

    it('can export two different CKL files properly', () => {
      // 19. Click "Format Profile Title". FYI. It might not do anything if the CKL file's title is already normalized.
    });

    // TODO: should this be under "Sidebar" or remain under "Checklist"? Saving the CKL file only matters when the saved intermediary CKL even gets edited
    it.skip('can save the CKL file to database', () => {
      // 5. Is the file saveable to the database? (What does this mean??? Can we select it from the load modal?) Yes according to database-results.cy.ts.
      uploadModal.loadSample(checklistFile);
      sidebar.saveFileToDatabase(checklistFile);
      checklistPageVerifier.isFileSavedToDatabase(checklistFile);
    });
  });

  // TODO: Remove? Should this even be here?
  describe.skip('User Modal', () => {
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
