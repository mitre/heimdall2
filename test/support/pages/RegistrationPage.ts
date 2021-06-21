import {CreateUserDto} from '../../../apps/backend/src/users/dto/create-user.dto';

export default class RegistrationPage {
  register(user: CreateUserDto): void {
    this.registerNoSubmit(user);
    /*
     * We have to force click the button here since the password complexity pipe hasn't always returned yet
     */
    cy.get('#register').click({force: true});
  }
  registerNoSubmit(user: CreateUserDto): void {
    cy.visit('/signup');
    cy.get('input[name=firstName]').type(user.firstName);
    cy.get('input[name=lastName]').type(user.lastName);
    cy.get('input[name=email]').type(user.email);
    cy.get('input[name=password]').type(user.password);
    cy.get('input[name=passwordConfirmation]').type(user.passwordConfirmation);
  }
}
