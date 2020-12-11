export default class UserModalVerifier {
  verifyFieldsExist(): void {
    cy.get('[data-cy=userModalTitle]').should(
      'contain',
      'Update your account information'
    );
    cy.get('[data-cy=updateUserForm]').should('exist');
  }
}
