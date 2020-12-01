import codeCoverageTask from '@cypress/code-coverage/task';
import {percyHealthCheck} from '@percy/cypress/task';
import axios from 'axios';
import Promise from 'bluebird';
import dotenv from 'dotenv';

dotenv.config();

export default (on: any, config: any) => {
  config.env.defaultPassword = process.env.SEED_DEFAULT_USER_PASSWORD;
  config.env.paginationPageSize = process.env.PAGINATION_PAGE_SIZE;

  const testDataApiEndpoint = `${config.env.apiUrl}/testData`;

  const queryDatabase = ({entity, query}, callback) => {
    const fetchData = async (attrs) => {
      const {data} = await axios.get(`${testDataApiEndpoint}/${entity}`);
      return callback(data, attrs);
    };

    return Array.isArray(query)
      ? Promise.map(query, fetchData)
      : fetchData(query);
  };

  on('task', {
    percyHealthCheck,
    'db:seed'() {
      const re = /[\n\r].*New administrator password is:s*([^\n\r]*)/;
      // seed database with admin user
      let data: RegExpExecArray;
      cy.exec('yarn backend sequelize-cli db:seed:all').then((result) => {
        data = re.exec(result.stdout);
      });
      return data;
    }
  });

  codeCoverageTask(on, config);
  return config;
};
