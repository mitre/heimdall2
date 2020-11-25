import {CreateUserDto} from '../../../apps/backend/src/users/dto/create-user.dto';

export default class RegistrationPage {
  register(user: CreateUserDto) {
    cy.get('input[name=email]').type(user.email);
    cy.get('input[name=password]').type(user.password);
    cy.get('input[name=passwordConfirmation]').type(user.passwordConfirmation);
    cy.get('#register').click();
  }
  registerNoSubmit(user: CreateUserDto) {
    cy.get('input[name=email]').type(user.email);
    cy.get('input[name=password]').type(user.password);
    cy.get('input[name=passwordConfirmation]').type(user.passwordConfirmation);
  }
}
