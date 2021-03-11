import Store from '@/store/store';
import axios from 'axios';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

/** Configure this to match data set in vue.config.ts */
declare const process: {
  env: {
    PACKAGE_VERSION: string;
    DESCRIPTION: string;
    REPOSITORY: string;
    LICENSE: string;
    CHANGELOG: string;
    BRANCH: string;
    ISSUES: string;
  };
};

export interface IAppInfoState {
  latestVersion: string;
  updateNotification: boolean;
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'info'
})
export class AppInfo extends VuexModule implements IAppInfoState {
  checkedForUpdates = false;
  updateNotification = false;
  latestVersion = '';

  @Mutation
  SET_VERSION(newVersion: string) {
    this.latestVersion = newVersion;
  }

  @Mutation
  SET_UPDATE_NOTIFICATION(visible: boolean) {
    this.updateNotification = visible;
  }

  @Mutation
  SET_CHECKED_FOR_UPDATES(value: boolean) {
    this.checkedForUpdates = value;
  }

  @Action
  public async CheckForUpdates() {
    if (this.checkedForUpdates === false) {
      // Call axios.create() to skip the default interceptors setup in main.ts
      axios
        .create()
        .get('https://api.github.com/repos/mitre/heimdall2/tags', {
          // Null out the request headers for this request
          // in order to avoid sending the local app authorization
          // to Github.
          headers: {common: ''}
        })
        .then(({data}) => {
          const latest = data[0].name.replace('v', '');
          this.context.commit('SET_VERSION', latest);
          if (latest !== this.version) {
            this.context.commit('SET_UPDATE_NOTIFICATION', true);
          }
        })
        .finally(() => {
          // Guard to stop checking for updates every tab change
          this.context.commit('SET_CHECKED_FOR_UPDATES', true);
        });
    }
  }

  @Action
  public SetUpdateVisibility(visible: boolean) {
    this.context.commit('SET_UPDATE_NOTIFICATION', visible);
  }

  /** The app version */
  get version(): string {
    return process.env.PACKAGE_VERSION;
  }

  /** The app description */
  get description(): string {
    return process.env.DESCRIPTION;
  }

  /** The full app repository url, e.g. "https://github.com/mitre/heimdall-lite" */
  get repository(): string {
    // The following line causes an error when using mount() to mount components.
    return process.env.REPOSITORY || '';
  }

  /** The username/org part of the repo url, e.g. mitre */
  get repo_org(): string {
    return this.repository.split('/')[3];
  }

  /** The project name of the repo url, e.g. heimdall-lite */
  get repo_name(): string {
    return this.repository.split('/')[4];
  }

  /** The app license */
  get license(): string {
    return process.env.LICENSE;
  }

  /** The app changelog */
  get changelog(): string {
    return process.env.CHANGELOG;
  }

  /** The app branch/build */
  get branch(): string {
    return process.env.BRANCH;
  }

  /** The app open new issues */
  get issues(): string {
    return process.env.ISSUES;
  }
}

export const AppInfoModule = getModule(AppInfo);
