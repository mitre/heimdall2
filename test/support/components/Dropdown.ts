import {UpdateUserDto} from '../../../apps/backend/src/users/dto/update-user.dto';

export default class Dropdown {
  openGroupsPage(): void {
    cy.get('#dropdown').click();
    cy.get('#dropdownList').get('#groups-link').click();
  }

  openAdminPanel(): void {
    cy.get('#dropdown').click();
    cy.get('#dropdownList').get('#admin-link').click();
  }

  openUserModal(): void {
    cy.get('#dropdown').click();
    cy.get('#dropdownList').get('#user-link').click();
  }

  changeUserData(user: UpdateUserDto): void {
    cy.get('#firstName').clear();
    cy.get('#firstName').type(user.firstName);
    cy.get('#lastName').clear();
    cy.get('#lastName').type(user.lastName);
    cy.get('#email_field').clear();
    cy.get('#email_field').type(user.email);
    cy.get('#title').clear();
    cy.get('#title').type(user.title);
    cy.get('#organization').clear();
    cy.get('#organization').type(user.organization);
    cy.get('#password_field').clear();
    cy.get('#password_field').type(user.currentPassword);
    cy.get('#toggleChangePassword').click();
    cy.get('#new_password_field').clear();
    cy.get('#new_password_field').type(user.password);
    cy.get('#repeat_password_field').clear();
    cy.get('#repeat_password_field').type(user.passwordConfirmation);
    cy.get('#closeAndSaveChanges').click();
  }

  logout(): void {
    cy.get('#dropdown').click();
    cy.get('#logout_button').click();
  }
}
