export default class GroupPage {
  selectAdminGroupTab(): void {
    cy.contains('v-tab', 'Group Management').click();
  }

  createGroup(name: string): void {
    cy.get('[data-cy=createNewGroupBtn]').click();
    cy.get('[data-cy=createGroupForm').within(() => {
      cy.get('[data-cy=name]').clear();
      cy.get('[data-cy=name]').type(name);
      cy.get('[data-cy=closeAndSaveChanges]').click();
    });
  }

  updateGroup(currentName: string, updatedName: string): void {
    cy.contains('span', currentName).parent().click();
    cy.get('[data-cy=edit]').click();
    cy.get('[data-cy=updateGroupForm').within(() => {
      cy.get('[data-cy=name]').clear();
      cy.get('[data-cy=name]').type(updatedName);
      cy.get('[data-cy=closeAndSaveChanges]').click();
    });
  }

  deleteGroup(name: string): void {
    cy.contains('span', name).parent().click();
    cy.get('[data-cy=delete]').click();
    cy.get('[data-cy=deleteConfirm]').click();
  }

  testGroupName(name: string): void {
    cy.get('[data-cy=createNewGroupBtn]').click();
    cy.get('[data-cy=createGroupForm').within(() => {
      cy.get('[data-cy=name]').clear();
      cy.get('[data-cy=name]').type(name);
    });
  }
}
