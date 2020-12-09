export default class LoginPage {
  login(user: {email: string; password: string}): void {
    cy.get('input[name=email]').clear().type(user.email);
    cy.get('input[name=password]').clear().type(user.password);
    cy.get('#login_button').click();
  }
  loginUserpass(username: string, password: string): void {
    cy.get('input[name=email]').clear().type(username);
    cy.get('input[name=password]').clear().type(password);
    cy.get('#login_button').click();
  }
}
