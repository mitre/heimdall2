export default class DatabaseHelper {
  createAdmin(): string {
    const re = /[\n\r].*New administrator password is:s*([^\n\r]*)/;
    let adminPassword = '';
    cy.exec(
      'sudo systemctl restart postgresql; sleep 2; yarn backend sequelize-cli db:drop; sleep 2; yarn backend sequelize-cli db:create; sleep 2; yarn backend sequelize-cli db:migrate; sleep 2; yarn backend sequelize-cli db:seed:all'
    ).then((result) => {
      adminPassword = re.exec(result.stdout)[1];
    });
    return adminPassword;
  }
}
