export default class Sidebar {
  open(): void {
    cy.get('.v-app-bar__nav-icon').click();
  }

  save(name: string): void {
    cy.get(`[title="${name}"]`).within(() => {
      cy.get('[data-cy=saveFile]').click();
    });
  }

  close(name: string): void {
    cy.get(`[title="${name}"]`).within(() => {
      cy.get('[data-cy=closeFile]').click();
    });
  }
}
