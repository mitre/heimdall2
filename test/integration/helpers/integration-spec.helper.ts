import axios from 'axios';

export class IntegrationSpecHelper {
  async addUser(USER) {
    return axios
      .post(process.env.APP_URL + '/users', USER)
      .then(({data}) => {
        return data;
      })
      .catch(error => {
        console.log(error);
      });
  }
}
