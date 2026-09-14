import { createUser, expectRequestError, login, selectOidcProfile } from '../support/auth';
import { ldap, user } from '../support/data';
import { openAccount } from '../support/ui';

describe('Login', () => {
  beforeEach(() => {
    createUser();
    cy.visit('/login');
  });

  it('authenticates a user with valid credentials', () => {
    cy.get('form[name="login_form"]').should('be.visible');
    cy.get('#login_form_title').should('contain.text', 'Login to Heimdall Server');
    cy.get('label[for="email_field"]').should('contain.text', 'Email');
    cy.get('label[for="password_field"]').should('contain.text', 'Password');
    login();
    cy.get('#info-snackbar').should('contain.text', 'You have successfully signed in.');
  });

  it('authenticates a GitHub OAuth user', () => {
    cy.get('#oauth-github').click();
    openAccount();
    cy.get('[data-cy="userModalTitle"]').should('contain.text', 'Update your account information');
    cy.get('#email_field').should('have.value', 'example@mitre.org');
  });

  it('authenticates an LDAP user with valid credentials', () => {
    cy.get('#select-tab-ldap-login').click();
    cy.get('form[name="login_form"]').should('be.visible');
    cy.get('label[for="username_field"]').should('contain.text', 'Username');
    cy.get('label[for="password_field"]').should('contain.text', 'Password');
    cy.get('[data-cy="ldapusername"]').type(ldap.username);
    cy.get('[data-cy="ldappassword"]').type(ldap.password, { log: false });
    cy.get('[data-cy="ldapLoginButton"]').click();
    cy.get('#info-snackbar').should('contain.text', 'You have successfully signed in.');
  });

  it('authenticates an OIDC user', () => {
    selectOidcProfile(true);
    cy.get('#oauth-oidc').click();
    openAccount();
    cy.get('[data-cy="userModalTitle"]').should('contain.text', 'Update your account information');
    cy.get('#email_field').should('have.value', 'example@example.com');
  });

  it('fails to authenticate a user with invalid credentials', () => {
    expectRequestError('/authn/login', 401);
    cy.intercept('POST', '/authn/login').as('login');
    login({ ...user, password: 'Invalid_password' });
    cy.wait('@login').its('response.statusCode').should('eq', 401);
    cy.get('#info-snackbar').should('contain.text', 'Incorrect Username or Password');
    cy.location('pathname').should('eq', '/login');
  });

  it('fails to authenticate an OIDC user with unverified email', () => {
    selectOidcProfile(false);
    cy.get('#oauth-oidc').click();
    cy.get('#info-snackbar').should('contain.text',
      'Please verify your name and email with your identity provider before logging into Heimdall.');
    cy.location('pathname').should('eq', '/login');
  });

  it('fails to authenticate an LDAP user with invalid credentials', () => {
    expectRequestError('/authn/login/ldap', 401);
    cy.intercept('POST', '/authn/login/ldap').as('ldapLogin');
    cy.get('#select-tab-ldap-login').click();
    cy.get('[data-cy="ldapusername"]').type(ldap.username);
    cy.get('[data-cy="ldappassword"]').type('zoiderg', { log: false });
    cy.get('[data-cy="ldapLoginButton"]').click();
    cy.wait('@ldapLogin').its('response.statusCode').should('eq', 401);
    cy.get('#info-snackbar').should('contain.text', 'Unauthorized');
  });

  it('successfully logs a user out', () => {
    login();
    cy.get('#info-snackbar').should('contain.text', 'You have successfully signed in.');
    cy.get('#hide-snackbar').click();
    cy.get('#dropdown').click();
    cy.get('#logout_button').click();
    cy.location('pathname').should('eq', '/login');
    cy.get('form[name="login_form"]').should('be.visible');
    cy.window().should((window) => {
      expect(window.localStorage.getItem('auth_token')).to.equal(null);
      expect(window.localStorage.getItem('localUserID')).to.equal(null);
    });
  });
});
