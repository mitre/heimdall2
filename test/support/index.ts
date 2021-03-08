/// <reference types="cypress" />

import RegistrationPage from '../support/pages/RegistrationPage';
import DatabaseHelper from './helpers/DatabaseHelper';

const databaseHelper = new DatabaseHelper();

beforeEach(function () {
  databaseHelper.clear();
});

Cypress.Commands.add('login', ({email, password}) => {
  cy.get('input[name=email]').clear().type(email);
  cy.get('input[name=password]').clear().type(password);
  cy.get('#login_button').click();
});

Cypress.Commands.add('register', (user) => {
  const registrationPage = new RegistrationPage();

  registrationPage.register(user);
});
