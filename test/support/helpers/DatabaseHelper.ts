export default class DatabaseHelper {
  clear(): void {
    cy.request({method: 'POST', url: 'http://127.0.0.1:3000/database/clear'});
  }
}
