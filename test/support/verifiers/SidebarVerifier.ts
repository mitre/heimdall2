export default class SidebarVerifier {
  isSidebarOpen(): void {
    cy.get('[data-cy=utilityDrawer]').should('exist');
  }

  isFileLoadedUnderDropdown(dropdown: string, file: string): void {
    cy.get(`[title="${dropdown}"]`).get(`[title="${file}"]`).should('exist');
  }

  isFileNotLoadedUnderDropdown(dropdown: string, file: string): void {
    cy.get(`[title="${dropdown}"]`)
      .get(`[title="${file}"]`)
      .should('not.exist');
  }
}
