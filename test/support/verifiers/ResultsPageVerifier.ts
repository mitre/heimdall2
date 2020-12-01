export default class ResultsPageVerifier {
  resultsDataCorrect(): void {
    cy.get('[data-cy=cardText]').should('contain', 'Passed: 0');
    cy.get('[data-cy=cardText]').should('contain', 'Failed: 3');
    cy.get('[data-cy=cardText]').should('contain', 'Not Applicable: 0');
    cy.get('[data-cy=cardText]').should('contain', 'Not Reviewed: 0');
  }
}
