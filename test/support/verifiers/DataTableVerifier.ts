export default class DataTableVerifier {
  verifyTextPresent(name: string): void {
    cy.get('.v-treeview').contains(name);
  }
}
