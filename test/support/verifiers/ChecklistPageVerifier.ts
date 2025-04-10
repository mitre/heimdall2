export default class ChecklistPageVerifier {
  hasMaximalNumberOfRules(): void {
    cy.get('[data-cy=numberOfShownAndHiddenRules]').contains(
      '372 shown, 0 hidden'
    );
  }

  doesNotHaveMaximalNumberOfRules(): void {
    cy.get('[data-cy=numberOfShownAndHiddenRules]').should(
      'not.contain',
      '372 shown, 0 hidden'
    );
  }

  isFileSavedToDatabase(file: string): void {
    // 1. make changes
    // 2. save the file
    // 3. reload the page
    // 4. load the saved file
  }
}
