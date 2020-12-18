export default class ResultsPage {
  openProfileInfo(): void {
    cy.get('[data-cy=profileInfo]').click();
  }
}
