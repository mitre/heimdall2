export default class DatabaseHelper {
  clear(): void {
    cy.request({method: 'POST', url: '/users/clear'});
  }
}
