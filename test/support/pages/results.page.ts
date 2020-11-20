import {UserDto} from "../../../apps/backend/src/users/dto/user.dto";

export default class ResultsPage {
  loadFirst(user: any) {
    cy.get('input[name=email]').type(user.email);
    cy.get('input[name=password]').type(user.password);
    cy.get('#login_button').click();
  }
}
