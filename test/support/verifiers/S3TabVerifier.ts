export default class S3TabVerifier {
  s3AccountCredentialsPresent(): void {
    cy.get('a[href="#uploadtab-s3"]').should('exist');
    cy.get('[id="step-1"]').should('contain', 'Account Credentials');
    cy.get('[id="step-2"]').should('contain', 'MFA Authorization');
    cy.get('[id="step-3"]').should('contain', 'Browse Bucket');
    cy.get('label[for=access_token]').should(
      'contain',
      'User Account Access Token'
    );
    cy.get('label[for=secret_token]').should(
      'contain',
      'User Account Secret Token'
    );
  }

  loginButtonsDisabled(): void {
    cy.get('#basic_login').should('be.disabled');
    cy.get('#mfa_login').should('be.disabled');
  }
}
