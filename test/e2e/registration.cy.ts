import { createUser, expectRequestError, fillRegistration } from '../support/auth';
import { user } from '../support/data';

describe('Registration', () => {
  beforeEach(() => {
    cy.visit('/signup');
  });

  it('allows a user to create an account', () => {
    cy.get('form[name="signup_form"]').should('be.visible');
    cy.get('#registration_form_title').should('contain.text', 'Register to Heimdall Server');
    cy.get('label[for="email_field"]').should('contain.text', 'Email');
    cy.get('label[for="password"]').should('contain.text', 'Password');
    cy.get('label[for="passwordConfirmation"]').should('contain.text', 'Confirm Password');
    fillRegistration();
    cy.get('#register').click();
    cy.get('#info-snackbar').should('contain.text', 'You have successfully registered, please sign in');
    cy.location('pathname').should('eq', '/login');
  });

  it('rejects emails that already exist', () => {
    createUser();
    expectRequestError('/users', 500);
    cy.intercept('POST', '/users').as('register');
    fillRegistration();
    cy.get('#register').click();
    cy.wait('@register').its('response.statusCode').should('eq', 500);
    cy.get('#info-snackbar').should('contain.text', 'Email must be unique');
  });

  it('rejects a weak password', () => {
    fillRegistration({ ...user, password: 'InvalidPass1', passwordConfirmation: 'InvalidPass1' });
    cy.get('#register').should('be.disabled');
  });

  it('rejects mismatching passwords', () => {
    fillRegistration({ ...user, passwordConfirmation: 'LETmeiN123%%%tP' });
    cy.get('#register').should('be.disabled');
  });
});
