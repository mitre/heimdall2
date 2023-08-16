import {
  ADMIN_LOGIN_AUTHENTICATION,
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../apps/backend/test/constants/users-test.constant';
import Dropdown from '../support/components/Dropdown';
import GroupPage from '../support/pages/GroupPage';
import ToastVerifier from '../support/verifiers/ToastVerifier';
import TreeviewVerifier from '../support/verifiers/TreeviewVerifier';

context('Groups', () => {
  const groupPage = new GroupPage();
  const dropdown = new Dropdown();
  const toastVerifier = new ToastVerifier();
  const treeviewVerifier = new TreeviewVerifier();
  const groupName1 = 'Test Group 1';
  const groupName2 = 'Test Group 2';
  const groupName3 = 'Test Group 3';
  const groupName4 = 'Test Group 4';

  // Run before each test
  beforeEach(() => {
    cy.register(CREATE_USER_DTO_TEST_OBJ);
    cy.register(CREATE_ADMIN_DTO);
    cy.visit('/login');
  });

  describe('CRUD', () => {
    it('allows a user to create a group', () => {
      cy.login(LOGIN_AUTHENTICATION);
      dropdown.openGroupsPage();
      groupPage.createGroup(groupName1);
      treeviewVerifier.verifyTextPresent(groupName1);
    });

    it('allows a user to update a group', () => {
      cy.login(LOGIN_AUTHENTICATION);
      const updatedGroupName = 'Updated Test Group';
      dropdown.openGroupsPage();
      groupPage.createGroup(groupName2);
      groupPage.updateGroup(groupName2, updatedGroupName);
      treeviewVerifier.verifyTextPresent(updatedGroupName);
    });

    it('allows an admin to delete a group', () => {
      cy.login(ADMIN_LOGIN_AUTHENTICATION);
      dropdown.openAdminPanel();
      groupPage.selectAdminGroupTab();
      groupPage.createGroup(groupName3);
      groupPage.deleteGroup(groupName3);
      toastVerifier.toastTextContains(
        `Successfully deleted group ${groupName3}`
      );
      treeviewVerifier.verifyTextPresent('No groups match current selection.');
    });

    it('fails to create a group with a duplicate name', () => {
      cy.login(LOGIN_AUTHENTICATION);
      dropdown.openGroupsPage();
      groupPage.createGroup(groupName4);
      groupPage.testGroupName(groupName4);
      toastVerifier.toastTextContains('Group names must be unique.');
    });
  });
});
