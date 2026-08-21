export interface S3Authentication {
  accessKey: string;
  secretKey: string;
  endpoint: string;
}

export default class S3Page {
  loginWithDirectCredentials(credentials: S3Authentication): void {
    cy.get('[data-cy=s3AccessToken]').clear();
    cy.get('[data-cy=s3AccessToken]').type(credentials.accessKey);
    cy.get('[data-cy=s3SecretToken]').clear();
    cy.get('[data-cy=s3SecretToken]').type(credentials.secretKey);
    cy.get('[data-cy=s3Endpoint]').clear();
    cy.get('[data-cy=s3Endpoint]').type(credentials.endpoint);
    cy.get('[data-cy=s3SkipSts]').check({force: true});
    cy.get('[data-cy=s3BasicLogin]').click();
  }

  loadBucket(name: string): void {
    cy.get('[data-cy=s3BucketName]').clear();
    cy.get('[data-cy=s3BucketName]').type(name);
    cy.get('[data-cy=s3LoadBucket]').click();
  }

  loadFile(name: string): void {
    cy.contains('[data-cy=s3FileList] .v-list-item', name)
      .find('[data-cy=s3LoadFile]')
      .click();
  }
}
