export default class Sidebar {
  openClose(): void {
    cy.get('[data-cy=openSidebar]').click({force: true});
  }

  save(name: string): void {
    this.openClose();
    cy.get(`[title="${name}"] [data-cy=saveFile]`).click();
    this.openClose();
  }

  close(name: string): void {
    this.openClose();
    cy.get(`[title="${name}"] [data-cy=closeFile]`).click();
    this.openClose();
  }

  unloadFile(name: string): void {
    this.close(name);
  }

  saveToHdf(name: string): void {
    cy.get(`[title="${name}"]`).get('[data-cy=saveToHdf]').click();
  }

  saveToDatabase(name: string): void {
    this.save(name);
  }
}
