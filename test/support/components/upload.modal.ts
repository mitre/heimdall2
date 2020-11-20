export default class UploadModal {
  loadFirstSample() {
    cy.get('#select-tab-sample').click();
    cy.get('#sampleItem').click();
  }
}
