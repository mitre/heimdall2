import { createUser, signIn } from '../support/auth';
import { sampleName } from '../support/data';
import { closeResult, loadSample, openDatabase, saveResult } from '../support/ui';

describe('Database results', () => {
  beforeEach(() => {
    createUser();
    signIn();
    loadSample(sampleName);
    saveResult(sampleName);
  });

  it('allows a user to save a result', () => {
    cy.get('#info-snackbar').should('contain.text', 'File saved successfully');
    cy.get('#hide-snackbar').click();
    openDatabase();
    cy.contains('[data-cy="loadDatabaseFileList"] td', sampleName).should('be.visible');
  });

  it('allows a user to load a result', () => {
    closeResult(sampleName);
    openDatabase();
    cy.get('[data-cy="loadDatabaseFileList"]').contains('span', sampleName).click();
    cy.get('[data-cy="fileinfo"]').should('contain.text', `Filename: ${sampleName}`);
  });

  it('allows a user to update a result', () => {
    closeResult(sampleName);
    openDatabase();
    cy.contains('[data-cy="loadDatabaseFileList"] td', sampleName).closest('tr').find('[data-cy="edit"]').click();
    cy.get('[data-cy="editEvaluationModal"]').within(() => {
      cy.get('[data-cy="filename"]').clear();
      cy.get('[data-cy="filename"]').type('Updated Filename');
      cy.get('[data-cy="closeAndSaveChanges"]').click();
    });
    cy.contains('[data-cy="loadDatabaseFileList"] td', 'Updated Filename').should('be.visible');
    cy.contains('[data-cy="loadDatabaseFileList"] td', sampleName).should('not.exist');
  });

  it('allows a user to delete a result', () => {
    closeResult(sampleName);
    openDatabase();
    cy.contains('[data-cy="loadDatabaseFileList"] td', sampleName).closest('tr').find('[data-cy="delete"]').click();
    cy.get('[data-cy="deleteConfirm"]').click();
    cy.contains('[data-cy="loadDatabaseFileList"] td', sampleName).should('not.exist');
    cy.get('[data-cy="loadDatabaseFileList"]').should('contain.text', 'No data found - try changing the search filter(s)');
  });
});
