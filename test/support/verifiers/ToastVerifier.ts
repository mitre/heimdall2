export default class ToastVerifier {
  toastTextContains(textToCheck: string): void {
    cy.get('div[class="v-snack__content"]', {timeout: 4000}).should('exist');
    cy.get('div[class="v-snack__content"]').should('contain', textToCheck);
  }
}
