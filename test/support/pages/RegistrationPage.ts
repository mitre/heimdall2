import {CreateUserDto} from '../../../apps/backend/src/users/dto/create-user.dto';

export default class RegistrationPage {
  register(user: CreateUserDto): void {
    this.registerNoSubmit(user);
    cy.get('#register').click({force: true});
  }
  registerNoSubmit(user: CreateUserDto): void {
    cy.visit('/signup');
    cy.get('input[name=firstName]').type(user.firstName);
    cy.get('input[name=lastName]').type(user.lastName);
    cy.get('input[name=email]').type(user.email);
    cy.intercept('POST', '*/check-password-complexity').as(
      'checkPasswordComplexity'
    );
    cy.get('input[name=password]').type(user.password);
    cy.wait('@checkPasswordComplexity')
      .its('response.statusCode')
      .should('equal', 201);
    cy.get('input[name=passwordConfirmation]').type(user.passwordConfirmation);
  }
}
