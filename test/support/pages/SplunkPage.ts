export default class SplunkPage {
  splunkLogin(user: {
    username: string;
    password: string;
    hostname: string;
  }): void {
    cy.get('[data-cy=splunkusername]').clear();
    cy.get('[data-cy=splunkusername]').type(user.username);
    cy.get('[data-cy=splunkpassword]').clear();
    cy.get('[data-cy=splunkpassword]').type(user.password);
    cy.get('[data-cy=splunkhostname]').clear();
    cy.get('[data-cy=splunkhostname]').type(user.hostname);

    cy.get('[data-cy=splunkLoginButton]').click();
  }
}
