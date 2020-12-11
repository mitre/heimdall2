export default class UserModalVerifier {
  verifyFieldsExist(): void {
    cy.get('#userModalTitle').should(
      'contain',
      'Update your account information'
    );
    cy.get('[data-cy=updateUserForm]').should('exist');
  }
}
