import {AppInfoModule} from '@/store/app_info';
import Store from '@/store/store';
import {LocalStorageVal} from '@/utilities/helper_util';
import {IStartupSettings, IUpdateUser, IUser} from '@heimdall/interfaces';
import axios from 'axios';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {SnackbarModule} from './snackbar';

const local_token = new LocalStorageVal<string | null>('auth_token');
const localUserID = new LocalStorageVal<string | null>('localUserID');

export interface IServerState {
  serverMode: boolean;
  serverUrl: string;
  loading: boolean;
  token: string;
  banner: string;
  userID: string;
  userInfo: IUser;
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
  /** Our User ID  */
  userID = '';
  /** Our User Role  */
  userRole = '';
  /** Provide a sane default for userInfo in order to avoid having to null check it all the time */
  userInfo: IUser = {
    id: -1,
    email: '',
    firstName: '',
    lastName: '',
    title: '',
    role: '',
    organization: '',
    loginCount: -1,
    lastLogin: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  @Mutation
  SET_TOKEN(newToken: string) {
    this.token = newToken;
    local_token.set(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }

  @Mutation
  SET_USERID(newID: string) {
    localUserID.set(newID);
    this.userID = newID;
  }

  @Mutation
  SET_STARTUP_SETTINGS(settings: IStartupSettings) {
    this.banner = settings.banner;
  }

  @Mutation
  SET_USER_INFO(info: IUser) {
    this.userInfo = info;
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
  }

  @Mutation
  CLEAR_USERID() {
    localUserID.clear();
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
      .then((response) => {
        if (response.status === 200) {
          // This means the server successfully responded and we are therefore in server mode
          this.SET_SERVER(potentialUrl);
          this.SET_STARTUP_SETTINGS(response.data);
          const token = local_token.get();
          const userID = localUserID.get();
          if (token !== null) {
            this.SET_TOKEN(token);
          }
          if (userID !== null) {
            this.SET_USERID(userID);
          }
          this.GetUserInfo();
        }
      })
      .catch((_) => {
        // If a error code is received from the server, this means the app is not in server mode
        // and there is therefore no action is required.
      })
      .then((_) => {
        this.SET_LOADING(false);
      });
  }
  @Action
  public async checkForUpdate() {
    // Only if we're running in lite mode or are admin
    console.log('hit');
    if (!this.serverMode || this.userInfo.role == 'admin') {
      const tempBearer = axios.defaults.headers.common['Authorization'];
      axios.defaults.headers.common['Authorization'] = '';
      // Get newest release
      const newest = await axios
        .get('https://api.github.com/repos/mitre/heimdall2/tags')
        .then(({data}) => data[0].name.replace('v', ''));
      axios.defaults.headers.common['Authorization'] = tempBearer;
      // Only show update if it's the newest version
      if (newest !== AppInfoModule.version) {
        SnackbarModule.update(newest);
      }
    }
  }

  @Action({rawError: true})
  public async Login(userInfo: {email: string; password: string}) {
    return axios.post('/authn/login', userInfo).then(({data}) => {
      this.SET_TOKEN(data.accessToken);
      this.SET_USERID(data.userID);
      this.GetUserInfo();
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

  @Action({rawError: true})
  public async updateUserInfo(userInfo: IUpdateUser): Promise<IUser> {
    return axios
      .put<IUser>(`/users/${this.userID}`, userInfo)
      .then(({data}) => {
        this.SET_USER_INFO(data);
        return data;
      });
  }

  @Action({rawError: true})
  public GetUserInfo(): void {
    axios
      .get<IUser>(`/users/${this.userID}`)
      .then(({data}) => this.SET_USER_INFO(data));
  }

  @Action
  public Logout(): void {
    this.CLEAR_USERID();
    this.CLEAR_TOKEN();
    location.reload();
  }
}

export const ServerModule = getModule(Server);
