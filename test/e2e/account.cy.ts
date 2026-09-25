import { createUser, login, signIn } from '../support/auth';
import { updatedUser, user } from '../support/data';
import { openAccount } from '../support/ui';

describe('Account', () => {
  beforeEach(() => {
    createUser();
    signIn();
  });

  it('displays the user modal and persists changes to account details and password', () => {
    openAccount();
    cy.get('[data-cy="userModalTitle"]').should('contain.text', 'Update your account information');
    cy.get('[data-cy="updateUserForm"]').within(() => {
      for (const [selector, value] of [
        ['#firstName', updatedUser.firstName],
        ['#lastName', updatedUser.lastName],
        ['#email_field', updatedUser.email],
        ['#title', updatedUser.title],
        ['#organization', updatedUser.organization],
      ]) {
        cy.get(selector).clear();
        cy.get(selector).type(value);
      }
      cy.get('#password_field').type(user.password, { log: false });
      cy.get('#toggleChangePassword').click();
      cy.get('#new_password_field').type(updatedUser.password, { log: false });
      cy.get('#repeat_password_field').type(updatedUser.passwordConfirmation, { log: false });
    });
    cy.get('#closeAndSaveChanges').click();
    cy.get('#info-snackbar').should('contain.text', 'User updated successfully.');
    cy.clearLocalStorage();
    cy.visit('/login');
    login(updatedUser);
    cy.get('#info-snackbar').should('contain.text', 'You have successfully signed in.');
    cy.get('#hide-snackbar').click();
    openAccount();
    cy.get('#firstName').should('have.value', updatedUser.firstName);
    cy.get('#lastName').should('have.value', updatedUser.lastName);
    cy.get('#email_field').should('have.value', updatedUser.email);
    cy.get('#title').should('have.value', updatedUser.title);
    cy.get('#organization').should('have.value', updatedUser.organization);
  });
});
