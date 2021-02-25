export default class DatabasePage {
  updateResultName(currentName: string, updatedName: string): void {
    cy.contains('td', currentName).parent().get('[data-cy=edit]').click();
    cy.get('[data-cy=editEvaluationModal').within(() => {
      cy.get('[data-cy=filename]').clear().type(updatedName);
      cy.get('[data-cy=closeAndSaveChanges]').click();
    });
  }

  deleteResult(name: string): void {
    cy.contains('td', name).parent().get('[data-cy=delete]').click();
    cy.get('[data-cy=deleteConfirm]').click();
  }
}
