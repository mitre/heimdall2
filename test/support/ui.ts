export function closeResult(name: string) {
  cy.get('[data-cy="openSidebar"]').click();
  cy.get(`[title="${name}"] [data-cy="closeFile"]`).click();
  cy.get('[data-cy="openSidebar"]').click();
  return cy.get('[data-cy="sidebar"]').should('not.be.visible');
}

export function createGroup(name: string) {
  cy.get('[data-cy="createNewGroupBtn"]').click();
  cy.get('[data-cy="createGroupForm"]').within(() => {
    cy.get('[data-cy="name"]').type(name);
    cy.get('[data-cy="closeAndSaveChanges"]').click();
  });
  return cy.get('[data-cy="createGroupForm"]').should('not.be.visible');
}

export function loadSample(name: string) {
  cy.get('#select-tab-sample').click();
  cy.get('#uploadtab-sample').within(() => {
    cy.get('[data-cy="fileSearchField"]').clear();
    cy.get('[data-cy="fileSearchField"]').type(name);
    cy.get('[data-cy="loadSampleFileList"]').contains('span', name).click();
  });
  return cy.get('[data-cy="fileinfo"]').should('contain.text', `Filename: ${name}`);
}

export function openAccount() {
  cy.get('#dropdown').click();
  cy.get('#dropdownList').find('#user-link').click();
  return cy.get('[data-cy="updateUserForm"]').should('be.visible');
}

export function openDatabase() {
  cy.get('#upload-btn').click();
  return cy.get('#select-tab-database').click();
}

export function openGroups() {
  cy.get('#dropdown').click();
  return cy.get('#dropdownList').find('#groups-link').click();
}

export function saveResult(name: string) {
  cy.intercept('POST', '/evaluations').as('saveResult');
  cy.get('[data-cy="openSidebar"]').click();
  cy.get(`[title="${name}"] [data-cy="saveFile"]`).click();
  cy.wait('@saveResult').its('response.statusCode').should('eq', 201);
  cy.get('[data-cy="openSidebar"]').click();
  return cy.get('[data-cy="sidebar"]').should('not.be.visible');
}
