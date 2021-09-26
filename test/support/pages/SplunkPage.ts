export default class SplunkPage {
  splunkLogin(user: {
    username: string;
    password: string;
    hostname: string;
  }): void {
    cy.get('[data-cy=splunkusername]').clear().type(user.username);
    cy.get('[data-cy=splunkpassword]').clear().type(user.password);
    cy.get('[data-cy=splunkhostname]').clear().type(user.hostname);

    cy.get('[data-cy=splunkLoginButton]').click();
  }
}
