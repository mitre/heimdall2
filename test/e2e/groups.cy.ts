import { createUser, signIn } from '../support/auth';
import { createGroup, openGroups } from '../support/ui';

const originalGroupName = /^Test Group$/v;

describe('Groups', () => {
  const name = 'Test Group';

  beforeEach(() => {
    createUser();
    signIn();
    openGroups();
  });

  it('allows a user to create a group', () => {
    createGroup(name);
    cy.contains('td', name).should('be.visible');
    cy.reload();
    cy.contains('td', name).should('be.visible');
  });

  it('allows a user to update a group', () => {
    createGroup(name);
    cy.contains('td', name).closest('tr').find('[data-cy="edit"]').click();
    cy.get('[data-cy="updateGroupForm"]').within(() => {
      cy.get('[data-cy="name"]').clear();
      cy.get('[data-cy="name"]').type('Updated Test Group');
      cy.get('[data-cy="closeAndSaveChanges"]').click();
    });
    cy.get('[data-cy="updateGroupForm"]').should('not.be.visible');
    cy.contains('td', 'Updated Test Group').should('be.visible');
    cy.reload();
    cy.contains('td', 'Updated Test Group').should('be.visible');
    cy.contains('td', originalGroupName).should('not.exist');
  });

  it('allows a user to delete a group', () => {
    createGroup(name);
    cy.contains('td', name).closest('tr').find('[data-cy="delete"]').click();
    cy.get('[data-cy="deleteConfirm"]').click();
    cy.get('#info-snackbar').should('contain.text', `Successfully deleted group ${name}`);
    cy.contains('td', name).should('not.exist');
    cy.reload();
    cy.contains('No groups match current selection.').should('be.visible');
  });

  it('fails to create a group with a duplicate name', () => {
    createGroup(name);
    cy.get('[data-cy="createNewGroupBtn"]').click();
    cy.get('[data-cy="createGroupForm"] [data-cy="name"]').type(name);
    cy.get('#info-snackbar').should('contain.text', 'Group names must be unique.');
    cy.get('[data-cy="createGroupForm"] [data-cy="closeAndSaveChanges"]').should('be.disabled');
  });
});
