export default class UploadModal {
  activate(): void {
    cy.get('#upload-btn').click();
  }

  loadSample(name: string): void {
    this.switchToTab('sample');
    this.loadFile(name);
  }

  loadFromDatabase(name: string): void {
    this.switchToTab('database');
    this.loadFile(name);
  }

  loadFile(name: string): void {
    cy.get('[data-cy=loadFileList]').within(() => {
      cy.contains(name).click();
    });
  }

  switchToTab(tab: string): void {
    cy.get(`#select-tab-${tab}`).click();
  }
}
