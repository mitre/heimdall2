import type { Credentials, TestUser } from './data';
import { user } from './data';

type Session = { accessToken: string; userID: string };

export function createUser(account: TestUser = user) {
  return cy.request('POST', '/users', account).its('status').should('eq', 201);
}

// Suppress only the Axios error expected from this test's deliberate bad request.
// Response status and user-visible failure are still asserted in the spec.
export function expectRequestError(pathname: string, status: number) {
  cy.on('uncaught:exception', (error: Error & { config?: { url: string }; response?: { status: number } }) => {
    if (error.response?.status === status && error.config?.url === pathname) {
      return false;
    }
  });
}

export function fillRegistration(account: TestUser = user) {
  cy.get('input[name="firstName"]').type(account.firstName);
  cy.get('input[name="lastName"]').type(account.lastName);
  cy.get('input[name="email"]').type(account.email);
  cy.get('input[name="password"]').type(account.password, { log: false });
  return cy.get('input[name="passwordConfirmation"]').type(account.passwordConfirmation, { log: false });
}

export function login(account: Credentials = user) {
  cy.get('input[name="email"]').clear();
  cy.get('input[name="email"]').type(account.email);
  cy.get('input[name="password"]').clear();
  cy.get('input[name="password"]').type(account.password, { log: false });
  return cy.get('#login_button').click();
}

export function selectOidcProfile(isEmailVerified: boolean) {
  return cy.request('POST', 'http://localhost:8082/__test__/profile', { emailVerified: isEmailVerified })
    .its('status').should('eq', 204);
}

export function signIn(account: Credentials = user, pathname = '/') {
  return cy.request<Session>('POST', '/authn/login', {
    email: account.email,
    password: account.password,
  }).then(({ body, status }) => {
    expect(status).to.equal(201);
    expect(body.accessToken).to.be.a('string').and.not.equal('');
    expect(body.userID).to.be.a('string').and.not.equal('');
    return cy.visit(pathname, {
      onBeforeLoad(window) {
        window.localStorage.setItem('auth_token', JSON.stringify(body.accessToken));
        window.localStorage.setItem('localUserID', JSON.stringify(body.userID));
      },
    });
  });
}
