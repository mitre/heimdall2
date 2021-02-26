export default class GroupPage {
  createGroup(name: string): void {
    cy.get('[data-cy=createNewGroupBtn]').click();
    cy.get('[data-cy=createGroupForm').within(() => {
      cy.get('[data-cy=name]').clear().type(name);
      cy.get('[data-cy=closeAndSaveChanges]').click();
    });
  }

  updateGroup(currentName: string, updatedName: string): void {
    cy.contains('td', currentName).parent().get('[data-cy=edit]').click();
    cy.get('[data-cy=updateGroupForm').within(() => {
      cy.get('[data-cy=name]').clear().type(updatedName);
      cy.get('[data-cy=closeAndSaveChanges]').click();
    });
  }

  deleteGroup(name: string): void {
    cy.contains('td', name).parent().get('[data-cy=delete]').click();
    cy.get('[data-cy=deleteConfirm]').click();
  }
}
