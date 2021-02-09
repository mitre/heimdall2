import Store from '@/store/store';
import {IGroup} from '@heimdall/interfaces';
import axios, {AxiosResponse} from 'axios';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {SnackbarModule} from './snackbar';

export interface IGroupState {
  allGroups: IGroup[];
  myGroups: IGroup[];
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'GroupsModule'
})
export class Groups extends VuexModule implements IGroupState {
  allGroups: IGroup[] = [];
  myGroups: IGroup[] = [];
  loading = true;

  @Mutation
  SET_ALL_GROUPS(groups: IGroup[]) {
    this.allGroups = groups;
  }

  @Mutation
  SET_MY_GROUPS(groups: IGroup[]) {
    this.myGroups = groups;
  }

  @Mutation
  SET_LOADING(loading: boolean) {
    this.loading = loading;
  }

  @Action
  public async FetchGroupData() {
    this.FetchAllGroups();
    this.FetchMyGroups();
    this.context.commit('SET_LOADING', false);
  }

  @Action
  public async FetchAllGroups() {
    this.FetchEndpoint('/groups').then(({data}) => {
      this.context.commit('SET_ALL_GROUPS', data);
    }).catch((err) => {
      SnackbarModule.failure(`${err}. Please reload the page and try again.`);
    })
  }

  @Action
  public async FetchMyGroups() {
    this.FetchEndpoint('/groups/my').then(({data}) => {
      this.context.commit('SET_MY_GROUPS', data);
    }).catch((err) => {
      SnackbarModule.failure(`${err}. Please reload the page and try again.`);
    })
  }

  @Action({rawError: true})
  public async FetchEndpoint(endpoint: string): Promise<AxiosResponse<IGroup[]>> {
    return axios.get<IGroup[]>(endpoint);
  }
}

export const GroupsModule = getModule(Groups);
