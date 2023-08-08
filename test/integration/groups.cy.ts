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
  const groupName1 = 'Test Group 1';
  const groupName2 = 'Test Group 2';
  const groupName3 = 'Test Group 3';
  const groupName4 = 'Test Group 4';

  describe('CRUD', () => {
    it('allows a user to create a group', () => {
      cy.register(CREATE_USER_DTO_TEST_OBJ);
      cy.visit('/login');
      cy.login(LOGIN_AUTHENTICATION).as('loginAuth');

      cy.wait('@loginAuth').then(async () => {
        dropdown.openGroupsPage();
        groupPage.createGroup(groupName1);
        dataTableVerifier.verifyTextPresent(groupName1);
      });
    });

    it('allows a user to update a group', () => {
      cy.register(CREATE_USER_DTO_TEST_OBJ);
      cy.visit('/login');
      cy.login(LOGIN_AUTHENTICATION).as('loginAuth');

      cy.wait('@loginAuth').then(async () => {
        const updatedGroupName = 'Updated Test Group';
        dropdown.openGroupsPage();
        groupPage.createGroup(groupName2);
        groupPage.updateGroup(groupName2, updatedGroupName);
        dataTableVerifier.verifyTextPresent(updatedGroupName);
      });
    });

    it('allows a user to delete a group', () => {
      cy.register(CREATE_USER_DTO_TEST_OBJ);
      cy.visit('/login');
      cy.login(LOGIN_AUTHENTICATION).as('loginAuth');

      cy.wait('@loginAuth').then(async () => {
        dropdown.openGroupsPage();
        groupPage.createGroup(groupName3);
        groupPage.deleteGroup(groupName3);
        toastVerifier.toastTextContains(
          `Successfully deleted group ${groupName3}`
        );
        dataTableVerifier.verifyTextPresent(
          'No groups match current selection.'
        );
      });
    });

    it('fails to create a group with a duplicate name', () => {
      cy.register(CREATE_USER_DTO_TEST_OBJ);
      cy.visit('/login');
      cy.login(LOGIN_AUTHENTICATION).as('loginAuth');

      cy.wait('@loginAuth').then(async () => {
        dropdown.openGroupsPage();
        groupPage.createGroup(groupName4);
        groupPage.testGroupName(groupName4);
        toastVerifier.toastTextContains('Group names must be unique.');
      });
    });
  });
});
