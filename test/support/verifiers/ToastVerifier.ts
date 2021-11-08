export default class ToastVerifier {
  readonly snackBar = 'div[class="v-snack__content"]';
  toastTextContains(textToCheck: string): void {
    cy.get(this.snackBar, {timeout: 6000}).should('exist');
    cy.get(this.snackBar).should('contain', textToCheck);
  }

  toastTextNotContains(): void {
    cy.get(this.snackBar).should('not.be.visible');
  }
}
