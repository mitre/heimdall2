import { createUser, signIn } from '../support/auth';
import { s3 } from '../support/data';

describe('S3', () => {
  beforeEach(() => {
    createUser();
    signIn();
  });

  it('lists and loads a file from a custom S3 endpoint', () => {
    cy.get('#select-tab-s3').click();
    cy.get('[data-cy="s3BasicLogin"]').should('contain.text', 'Basic Login');
    cy.get('[data-cy="s3AccessToken"]').type(s3.accessKey);
    cy.get('[data-cy="s3SecretToken"]').type(s3.secretKey, { log: false });
    cy.get('[data-cy="s3Endpoint"]').type(s3.endpoint);
    cy.contains('label', 'Use credentials directly (skip STS)').click();
    cy.get('[data-cy="s3SkipSts"]').should('be.checked');
    cy.get('[data-cy="s3BasicLogin"]').click();
    cy.get('[data-cy="s3BucketName"]').type(s3.bucket);
    cy.get('[data-cy="s3LoadBucket"]').click();
    cy.get('[data-cy="s3FileList"]').should('contain.text', s3.filename);
    cy.contains('[data-cy="s3File"]', s3.filename).find('[data-cy="s3LoadFile"]').click();
    cy.get('[data-cy="fileinfo"]').should('contain.text', `Filename: ${s3.filename}`);
  });
});
