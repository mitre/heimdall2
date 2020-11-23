
export default class UserModalVerifier {
  verifyFieldsExist() {
    cy.get('form[name="userInfo"]').should('exist');
    cy.get('form[name="changePassword"]').should('exist');
    cy.get('#userModalTitle').should('contain', 'Update your account information')
  }
}
