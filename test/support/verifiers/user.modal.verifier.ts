export default class UserModalVerifier {
  verifyFieldsExist() {
    cy.get('#userModalTitle').should(
      'contain',
      'Update your account information'
    );
    cy.get('form[name="userInfo"]').should('exist');
  }
}
