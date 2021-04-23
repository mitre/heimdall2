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
}
