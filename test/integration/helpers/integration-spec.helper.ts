import axios from 'axios';

export class IntegrationSpecHelper {
  private readonly url: string;
  constructor(url: string) {
    this.url = url;
  }

  async addUser(user: any): Promise<any> {
    return axios
      .post(this.url + '/users', user)
      .then(({data}) => {
        return data;
      })
      .catch(error => {
        console.log(error);
      });
  }

  // Useful for debugging
  static async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
