import {CreateUserDto} from '../../../apps/backend/src/users/dto/create-user.dto';

export default class RegistrationPage {
  register(user: CreateUserDto): void {
    this.registerNoSubmit(user);
    cy.waitUntil(() => cy.get('#register').should('not.be.disabled'));
    cy.get('#register').click();
  }
  registerNoSubmit(user: CreateUserDto): void {
    cy.visit('/signup');
    cy.get('#firstName_field').type(user.firstName);
    cy.get('#lastName_field').type(user.lastName);
    cy.get('#email_field').type(user.email);
    cy.get('#password').type(user.password);
    cy.get('#passwordConfirmation').type(
      user.passwordConfirmation
    );
  }
}
