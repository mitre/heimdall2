export default class DatabaseHelper {
  createAdmin(): string {
    const re = /[\n\r].*New administrator password is:s*([^\n\r]*)/;
    let adminPassword = '';
    cy.exec('sudo systemctl restart postgresql');
    cy.exec('sleep 2');
    cy.exec('yarn backend sequelize-cli db:drop');
    cy.exec('yarn backend sequelize-cli db:create');
    cy.exec('yarn backend sequelize-cli db:migrate');
    cy.exec('yarn backend sequelize-cli db:seed:all').then((result) => {
      adminPassword = re.exec(result.stdout)[1];
    });
    return adminPassword;
  }
}
