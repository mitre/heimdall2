export default class ResultsPage {
  openProfileInfo(): void {
    cy.get('[data-cy=profileInfo]').click();
  }

  openFirstResultCodeTab(): void {
    cy.get('div.v-card__text.pa-2.font-weight-bold').first().click();
    cy.get('a[href="#tab-code"]').click();
  }
}
