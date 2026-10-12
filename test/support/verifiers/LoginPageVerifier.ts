export default class LoginPageVerifier {
  loginFormPresent(): void {
    cy.get('form[name="login_form"]').should('exist');
    cy.get('#login_form_title').should('contain', 'Login to Heimdall Server');
    cy.get('label[for=email_field]').should('contain', 'Email');
    cy.get('label[for=password_field]').should('contain', 'Password');
  }
  ldapLoginFormPresent(): void {
    cy.get('form[name="login_form"]').should('exist');
    cy.get('label[for=username_field]').should('contain', 'Username');
    cy.get('label[for=password_field]').should('contain', 'Password');
  }
}
