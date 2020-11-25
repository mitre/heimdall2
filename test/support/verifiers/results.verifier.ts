export default class ResultsPageVerifier {
  resultsDataCorrect(): void {
    const cardsHTML: string[] = [];
    cy.get('[data-cy=cardText]').each((card): void => {
      cardsHTML.push(card.text());
    });
    expect(cardsHTML).to.contain('Passed: 0');
    expect(cardsHTML).to.contain('Failed: 3');
    expect(cardsHTML).to.contain('Not Applicable: 0');
    expect(cardsHTML).to.contain('Not Reviewed: 0');
  }
}
