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

import {IStartupSettings} from '@heimdall/interfaces';

const local_token = new LocalStorageVal<string | null>('auth_token');

export interface IServerState {
  serverMode: boolean;
  serverUrl: string;
  loading: boolean;
  token: string;
  banner: string;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'ServerModule'
})
class Server extends VuexModule implements IServerState {
  banner = '';
  serverUrl = '';
  serverMode = false;
  loading = true;
  /** Our currently granted JWT token */
  token = '';

  @Mutation
  SET_TOKEN(newToken: string) {
    this.token = newToken;
    local_token.set(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }

  @Mutation
  SET_STARTUP_SETTINGS(settings: IStartupSettings) {
    this.banner = settings.banner;
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
      return null;
    }

    const potentialUrl = window.location.origin;

    return axios
      .get(`${potentialUrl}/server`)
      .then(response => {
        if (response.status === 200) {
          // This means the server successfully responded and we are therefore in server mode
          this.SET_SERVER(potentialUrl);
          this.SET_STARTUP_SETTINGS(response.data);
          const token = local_token.get();
          if (token !== null) {
            this.SET_TOKEN(token);
          }
        }
      })
      .catch(_ => {
        // If a error code is received from the server, this means the app is not in server mode
        // and there is therefore no action is required.
      })
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
