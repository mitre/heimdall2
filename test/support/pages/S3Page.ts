export default class S3Page {
  s3BasicLogin(user: {accessToken: string; secretToken: string}): void {
    cy.get('[data-cy=s3AccessToken]').clear().type(user.accessToken);
    cy.get('[data-cy=s3SecretToken]').clear().type(user.secretToken);

    cy.get('[data-cy=s3BasicLogin]').click();
  }
}
