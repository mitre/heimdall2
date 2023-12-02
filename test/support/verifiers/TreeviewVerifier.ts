export default class TreeviewVerifier {
  verifyTextPresent(name: string): void {
    cy.get('.v-treeview').contains(name);
  }
}
