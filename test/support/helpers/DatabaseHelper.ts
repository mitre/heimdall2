export default class DatabaseHelper {
  clear(): void {
    cy.request('http://127.0.0.1:3000/database/clear', { method: 'POST'});
  }
}
