export default class LoginPage {
  login(user: {email: string; password: string}): void {
    cy.get('input[name=email]').clear().type(user.email);
    cy.get('input[name=password]').clear().type(user.password);
    cy.get('#login_button').click();
  }

  loginOauth(oauthStrategy: string): void {
    cy.get(`#oauth-${oauthStrategy}`).click({force: true});
  }

  ldapLogin(user: {username: string; password: string}): void {
    cy.get('[data-cy=ldapusername]').clear().type(user.username);
    cy.get('[data-cy=ldappassword]').clear().type(user.password);
    cy.get('[data-cy=ldapLoginButton]').click();
  }

  async keyCloakLogin(user: {
    username: string;
    password: string;
  }): Promise<void> {
    cy.get('input[name=username]').clear().type(user.username);
    cy.get('input[name=password]').clear().type(user.password);
    cy.get('#kc-login').click();
  }

  switchToLDAPAuth(): void {
    cy.get('#select-tab-ldap-login').click();
  }
}
