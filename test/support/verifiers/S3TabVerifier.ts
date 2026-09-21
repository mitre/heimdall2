export default class S3TabVerifier {
  s3Present(): void {
    cy.get('a[href="#uploadtab-s3"]').should('exist');
    cy.get('[data-cy=s3BasicLogin]').should('contain', 'Basic Login');
  }

  fileIsListed(name: string): void {
    cy.get('[data-cy=s3FileList]').should('contain', name);
  }
}
