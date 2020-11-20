
export default class ToastVerifier {
    toastTextContains(textToCheck: string) {
      cy.wait(4000)
      cy.get('div[class="v-snack__content"]').should('exist')
      cy.get('div[class="v-snack__content"]').should(
        'contain',
        textToCheck
      );
    }
  }
  