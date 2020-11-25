export default class RegistrationPageVerifier {
  registerFormPresent(): void {
    cy.get('form[name="signup_form"]').should('exist');
    cy.get('#registration_form_title').should(
      'contain',
      'Register to Heimdall Server'
    );
    cy.get('label[for=email_field]').should('contain', 'Email');
    cy.get('label[for=password]').should('contain', 'Password');
    cy.get('label[for=passwordConfirmation]').should(
      'contain',
      'Confirm Password'
    );
  }

  registerButtonDisabled(): void {
    cy.get('#register').should('be.disabled');
  }
}
