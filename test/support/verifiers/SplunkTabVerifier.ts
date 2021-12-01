export default class SplunkTabVerifier {
  splunkPresent(): void {
    cy.get('a[href="#uploadtab-splunk"]').should('exist');
    cy.get('[id="step-1"]').should('contain', 'Login Credentials');
    cy.get('[id="step-2"]').should('contain', 'Search Execution Events');
  }
}
