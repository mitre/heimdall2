export default class LoginPage {
  loginOauth(oauthStrategy: string): void {
    cy.get(`#oauth-${oauthStrategy}`).click({force: true});
  }

  ldapLogin(user: {username: string; password: string}): void {
    cy.get('[data-cy=ldapusername]').clear();
    cy.get('[data-cy=ldappassword]').clear();

    cy.get('[data-cy=ldapusername]').type(user.username);
    cy.get('[data-cy=ldappassword]').type(user.password);
    cy.get('[data-cy=ldapLoginButton]').click();
  }

  switchToLDAPAuth(): void {
    cy.get('#select-tab-ldap-login').click();
  }
}
