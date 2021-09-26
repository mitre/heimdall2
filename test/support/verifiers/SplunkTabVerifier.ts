export default class SplunkTabVerifier {
  splunkPresent(): void {
    cy.get('a[href="#uploadtab-splunk"]').should('exist');
    cy.get('[id="step-1"]').should('contain', 'Login Credentials');
    cy.get('[id="step-2"]').should('contain', 'Search Execution Events');
    cy.get('label[for=username_field]').should('contain', 'Username');
    cy.get('label[for=password_field]').should('contain', 'Password');
    cy.get('label[for=hostname_field]').should('contain', 'Hostname');
    cy.get('.check-box-sub-text').should('not.exist');
  }
}
