export default class LoginPage {
  loginSuccess(user: {email: string; password: string}) {
    cy.get('input[name=email]').type(user.email);
    cy.get('input[name=password]').type(user.password);
    cy.get('#login_button').click();
  }
}
