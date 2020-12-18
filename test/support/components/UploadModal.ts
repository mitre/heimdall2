export default class UploadModal {
  loadFirstSample(): void {
    cy.get('#select-tab-sample').click();
    cy.get('#sampleItem').click();
  }

  switchToTab(tab: string): void {
    cy.get(`#select-tab-${tab}`).click();
  }
}
