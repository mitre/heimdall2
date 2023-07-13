export default class UploadModal {
  activate(): void {
    cy.get('#upload-btn').click();
  }

  loadSample(name: string): void {
    this.switchToTab('sample');
    this.loadFile('uploadtab-sample', name);
  }

  loadFromDatabase(name: string): void {
    this.switchToTab('database');
    this.loadFile('uploadtab-database', name);
  }

  loadFile(parentTabId: string, name: string): void {
    cy.get(`#${parentTabId} [data-cy=loadFileList]`).within(() => {
      cy.contains(name).click({force: true});
    });
  }

  switchToTab(tab: string): void {
    cy.get(`#select-tab-${tab}`).click();
  }
}
