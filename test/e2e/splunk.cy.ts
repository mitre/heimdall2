import { createUser, signIn } from '../support/auth';
import { splunk } from '../support/data';

describe('Splunk', () => {
  beforeEach(() => {
    createUser();
    signIn();
    cy.get('#select-tab-splunk').click();
    cy.get('#step-1').should('contain.text', 'Login Credentials');
    cy.get('#step-2').should('contain.text', 'Search Execution Events');
  });

  for (const { message, password, status, title } of [
    { message: 'You have successfully signed in', password: splunk.password, status: 200, title: 'authenticates a user with valid Splunk credentials' },
    { message: 'Failed to login - Incorrect username or password', password: 'Invalid_password!', status: 401, title: 'fails to authenticate a Splunk user with invalid credentials' },
  ]) {
    it(title, () => {
      cy.intercept('POST', `${splunk.hostname}/services/auth/login*`).as('splunkLogin');
      cy.get('[data-cy="splunkusername"]').type(splunk.username);
      cy.get('[data-cy="splunkpassword"]').type(password, { log: false });
      cy.get('[data-cy="splunkhostname"]').type(splunk.hostname);
      cy.get('[data-cy="splunkLoginButton"]').click();
      cy.wait('@splunkLogin').its('response.statusCode').should('eq', status);
      cy.get('#info-snackbar').should('contain.text', message);
    });
  }
});
