import {UpdateUserDto} from "../../../apps/backend/src/users/dto/update-user.dto";

export default class LoginPage {
  loginSuccess(user: UpdateUserDto) {
    cy.get('input[name=email]').type(user.email);
    cy.get('input[name=password]').type(user.password);
    cy.get('#login_button').click();
  }
}
