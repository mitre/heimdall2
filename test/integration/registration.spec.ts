/// <reference types="cypress" />

import Registration from '../support/pages/registration.page';


context('Registration', () => {

  beforeEach(async () => {
    cy.visit('/signup');
  });
  describe('Registration Form', () => {
    it('allows a user to create an account', () => {
      Registration.registerSuccess();
      // await logInVerifier.verifyLoginFormPresent(page);
      // await toastVerifier.verifySuccessPresent(
      //   page,
      //   'You have successfully registered, please sign in'
      // );
    });
  });
})
