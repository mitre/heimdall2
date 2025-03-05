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
    it('displays correct data for the Clean RHEL 8 Checklist sample', () => {
      cy.debug();

      const checklistFile = 'Clean RHEL 8 Checklist';

      // 0. Load the file
      uploadModal.loadSample(checklistFile);

      // 1. Is the sidebar open by default? i.e. [data-cy=utilityDrawer] exists
      sidebarVerifier.isSidebarOpen();

      // 2. Is the loaded file present under the correct dropdown? i.e. Correct filename
      sidebarVerifier.isFileLoadedUnderDropdown('Checklists', checklistFile);

      // 3. Is the file unloadable and reloadable? Can a non-checklist file be loaded and seen that it is not under the Checklists dropdown?
      sidebar.unloadFile(checklistFile);
      sidebarVerifier.isFileNotLoadedUnderDropdown('Checklists', checklistFile);

      // 4. Is the file saveable to HDF? (What does this mean?)
      sidebar.saveToHdf(checklistFile);
      sidebarVerifier.isFileSavedToHdfJson(checklistFile);

      cy.pause();

      // 5. Is the file saveable to the database? (Can we select it from the load modal?)
      sidebar.saveToDatabase(checklistFile);
      sidebarVerifier.isFileSavedToDatabase(checklistFile);

      // 6. Are all of the common filters toggleable? Maybe modify some rules first before clicking any toggles.
      // 7. Do the filter keywords work? What if we try invalid inputs and keywords?
      // 8. Top-navigation bar: type in some query string, like the keyword "vendor". Is this reflected in the sidebar? If so, look for its row under "Selected Filters" and remove it as a keyword. --- this might not be a Checklist test but a Sidebar test. TODO: maybe make a Sidebar and top-nav bar test per each page since they're both found on each page.
      // 9. Sidebar filter: add a negated filter. Correct number of results? No?
      // 10. Try to add a filter that already exists. Does it get added? More than 1 filter, or no?
      // 11. Close the sidebar. Are the checklist table dropdown checkboxes clickable? Do they work?
      // 12. Click the second rule. Does the NIST tag URL lead to a real webpage? - Does that webpage refer to the NIST tag? Otherwise broken URL test.
      // 13. Open the sidebar again. Open the technology area modal. Select a value. Clear it. Select a different one. Close it by clicking the close button.
      // 14. Open the target data modal. Select a value. Clear it. Select a different one. Close it by clicking out of the modal (like the Sidebar).
      // 15. Modify this rule's status, severity, and type a justification, modify finding details, comments. See that it persists when clicking a different rule and clicking back.
      // 16. Repeat step 15 for the next rule. See that it persists when clicking a different rule and clicking back.
      // 17. Load another checklist, "Three Stig Checklist". Then select "Clean RHEL 8 Checklist" again.
      // 18. Modify the first rule in this checklist. Click "Export" and then "Export as DISA Checklist", then select the checklist.
      // 19. Click "Format Profile Title". FYI. It might not do anything if the CKL file's title is already normalized.

      // Scroll controls into view
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
