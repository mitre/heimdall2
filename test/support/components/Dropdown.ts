import {UpdateUserDto} from '../../../apps/backend/src/users/dto/update-user.dto';

export default class Dropdown {
  openUserModal(): void {
    cy.get('#dropdown').click();
    cy.get('#dropdownList').get('div[role="menuitem"]').first().click();
  }
  changeUserData(user: UpdateUserDto): void {
    cy.get('#firstName').clear().type(user.firstName);
    cy.get('#lastName').clear().type(user.lastName);
    cy.get('#email_field').clear().type(user.email);
    cy.get('#title').clear().type(user.title);
    cy.get('#organization').clear().type(user.organization);
    cy.get('#password_field').clear().type(user.currentPassword);
    cy.get('#toggleChangePassword').click();
    cy.get('#new_password_field').clear().type(user.password);
    cy.get('#repeat_password_field').clear().type(user.passwordConfirmation);
    cy.get('#closeAndSaveChanges').click();
  }

  logout(): void {
    cy.get('#dropdown').click();
    cy.get('#logout_button').click();
  }
}
