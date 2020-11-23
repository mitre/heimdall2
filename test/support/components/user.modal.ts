export default class UserModal {
  openUserModal() {
    cy.get('#dropdown').click();
    cy.get('#list-item-541').click();
  }
}
