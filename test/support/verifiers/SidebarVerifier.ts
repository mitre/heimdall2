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

  isFileSavedToHdfJson(file: string): void {
    cy.get('[title=Results]').click();
    cy.get('[data-cy=exportButton]').click();
    cy.get('[data-cy]=exportJson').click();
    cy.readFile('./cypress/downloads/exported_jsons.zip', 'binary').then(
      (content) => {
        expect(
          content.includes(`exported_jsons/${file.replace(' ', '_')}.json`)
        );
      }
    );
  }

  isFileSavedToDatabase(file: string): void {
    //
  }
}
