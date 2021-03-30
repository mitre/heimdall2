export default class ResultsPageVerifier {
  resultsFilenameCorrect(name: string): void {
    cy.get('[data-cy=fileinfo]').contains(`Filename: ${name}`);
  }

  resultsDataCorrect(): void {
    const correctFileInfo: string[] = [
      'Acme Overlay Example',
      '4.19.2',
      'mac_os_x19.4.0',
      '0.605412'
    ];
    const correctProfileInfo: string[] = [
      'Acme Overlay Example',
      '0.2.0',
      '6414f43b3c6ff3106c96b2e75067a9ed6144a728373b864f4de8b3fb3c6c528f',
    ];
    const correctCards: string[] = [
      'Passed: 5',
      'Failed: 60',
      'Not Applicable: 1',
      'Not Reviewed: 35'
    ];
    cy.get('[data-cy=profileInfoFields]').then((result) => {
      expect(result[0].innerText).to.exist;
      correctProfileInfo.forEach((item) => {
        expect(result[0].innerText).to.include(item);
      });
    });
    cy.get('[data-cy=fileinfo]').then((result) => {
      expect(result[0].innerText).to.exist;
      correctFileInfo.forEach((item) => {
        expect(result[0].innerText).to.include(item);
      });
    });
    cy.get('[data-cy=cardText]').each((card) => {
      expect(card[0].innerText).to.be.oneOf(correctCards);
    });
  }
}
