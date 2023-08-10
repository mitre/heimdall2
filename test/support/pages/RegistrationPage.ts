import {CreateUserDto} from '../../../apps/backend/src/users/dto/create-user.dto';

export default class RegistrationPage {
  register(user: CreateUserDto): void {
    this.registerNoSubmit(user);
    cy.waitUntil(() => cy.get('#register').should('not.be.disabled'));
    cy.get('#register').click();
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
