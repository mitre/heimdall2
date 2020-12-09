export default class ResultsPageVerifier {
  resultsDataCorrect(): void {
    const correctFileInfo: string[] = [
      'Sonarqube Java Heimdall_tools Sample',
      '1.3.0',
      'Heimdall Tools1.3.0',
      'null'
    ];
    const correctProfileInfo: string[] = [
      '7.9.1.27448',
      'Sonarqube Java Heimdall_tools Sample',
      'Thu,26 Sep 2019 10:56:37',
      '6f94b370ebaa414fda5a2a80575cc772e3d0cc58ce04adc6d74a61a48080c886',
      'SonarQube Scan of Project: heimdall'
    ];
    const correctCards: string[] = [
      'Passed: 0',
      'Failed: 3',
      'Not Applicable: 0',
      'Not Reviewed: 0'
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

  controlRowsCorrect(): void {
    const correctFirstControlRow = {
      status: 'Failed',
      id: 'squid:S4347',
      impact: 'HIGH',
      title: '"SecureRandom" seeds should not be predictable'
    };

    cy.get('[data-cy=controlRow]').first((control) => {
      expect(this.convertControl(control[0])).to.equal(correctFirstControlRow);
    });
  }

  convertControl(control: any): object {
    return control.children[0];
  }
}
