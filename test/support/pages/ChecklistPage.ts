export default class ChecklistPage {
  openProfileInfo(): void {
    cy.get('[data-cy=profileInfo]').click();
  }
}
