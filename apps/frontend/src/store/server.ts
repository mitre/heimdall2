import {
  Module,
  VuexModule,
  Mutation,
  Action,
  getModule
} from 'vuex-module-decorators';
import Store from '@/store/store';
import axios from 'axios';
import {LocalStorageVal} from '@/utilities/helper_util';

const local_token = new LocalStorageVal<string | null>('auth_token');

export interface IServerState {
  serverMode: boolean;
  serverUrl: string;
  loading: boolean;
  token: string;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'ServerModule'
})
class Server extends VuexModule implements IServerState {
  serverUrl = '';
  serverMode = false;
  loading = true;
  /** Our currently granted JWT token */
  token = '';

  @Mutation
  SET_TOKEN(new_token: string) {
    this.token = new_token;
    local_token.set(new_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${new_token}`;
  }

  @Mutation
  SET_SERVER(server: string) {
    this.serverUrl = server;
    this.serverMode = true;
  }

  @Mutation
  SET_LOADING(loading: boolean) {
    this.loading = loading;
  }

  @Mutation
  CLEAR_TOKEN() {
    local_token.clear();
    location.reload();
  }

  /* Try to find the Heimdall-Server backend. We have configured the Vue dev server to
   * automatically proxy VUE_APP_API_URL, so all we need to do is check if we get a response
   * at /server.
   *
   * Returns null if no server is found, or the server URL if one is.
   */
  @Action
  public async CheckForServer() {
    // This is the only function that manipulates the loading state. If loading is already set
    // then we have already loaded the server information and there is no need to check again.
    if (!this.loading) {
      return;
    }

    let potentialUrl = window.location.origin;

    return axios
      .get(potentialUrl + '/server')
      .then(response => {
        if (response.status == 200) {
          // This means the server successfully responded and we are therefore in server mode
          this.SET_SERVER(potentialUrl);
          let token = local_token.get();
          if (token !== null) {
            this.SET_TOKEN(token);
          }
        }
      })
      .catch(_ => {})
      .then(_ => {
        this.SET_LOADING(false);
      });
  }

  @Action({rawError: true})
  public async Login(userInfo: {email: string; password: string}) {
    return axios.post('/authn/login', userInfo).then(({data}) => {
      this.SET_TOKEN(data.accessToken);
    });
  }

  @Action({rawError: true})
  public async Register(userInfo: {
    email: string;
    password: string;
    passwordConfirmation: string;
  }) {
    return axios.post('/users', userInfo);
  }

  @Action
  public Logout(): void {
    this.CLEAR_TOKEN();
  }
}

export const ServerModule = getModule(Server);
