import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import Dropdown from '../support/components/Dropdown';
import GroupPage from '../support/pages/GroupPage';
import DataTableVerifier from '../support/verifiers/DataTableVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';

context('Groups', () => {
  const groupPage = new GroupPage();
  const dropdown = new Dropdown();
  const toastVerifier = new ToastVerifier();
  const dataTableVerifier = new DataTableVerifier();
  const groupName = 'Test Group';
  const updatedGroupName = 'Updated Test Group';

  // Run before each test
  beforeEach(() => {
    cy.register(CREATE_USER_DTO_TEST_OBJ);
    cy.visit('/login');
    cy.login(LOGIN_AUTHENTICATION);
  });

  describe('CRUD', () => {
    it('allows a user to create a group', () => {
      dropdown.openGroupsPage();
      groupPage.createGroup(groupName);
      dataTableVerifier.verifyTextPresent(groupName);
    });

    it('allows a user to update a group', () => {
      dropdown.openGroupsPage();
      groupPage.updateGroup('Test Group', updatedGroupName);
      dataTableVerifier.verifyTextPresent(updatedGroupName);
    });

    it('allows a user to delete a group', () => {
      dropdown.openGroupsPage();
      groupPage.deleteGroup(updatedGroupName);
      toastVerifier.toastTextContains(
        `Successfully deleted group ${updatedGroupName}`
      );
      dataTableVerifier.verifyTextPresent('No groups match current selection.');
    });
  });
});
