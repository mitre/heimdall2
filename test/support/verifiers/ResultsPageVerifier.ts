export default class ResultsPageVerifier {
  resultsDataCorrect(): void {
    const correct: string[] = [
      'Passed: 0',
      'Failed: 3',
      'Not Applicable: 0',
      'Not Reviewed: 0'
    ];
    cy.get('[data-cy=cardText]').each((card) => {
      expect(card[0].innerText).to.be.oneOf(correct);
    });
  }
}
