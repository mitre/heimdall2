export default class DataTableVerifier {
  verifyTextPresent(name: string): void {
    cy.get('.v-data-table').contains(name);
  }
}
