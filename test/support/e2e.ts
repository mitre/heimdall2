import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector';

installLogsCollector();

beforeEach(() => {
  cy.intercept('https://api.github.com/repos/mitre/heimdall2/tags', [{ name: 'v9.9.9' }]);
  // This endpoint is available only on explicitly enabled development/test servers.
  cy.request('POST', '/users/clear').its('status').should('eq', 201);
});
