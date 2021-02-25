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

  @Mutation
  ADD_TO_MY_GROUPS(added: IGroup) {
    this.myGroups.push(added);
  }

  @Mutation
  UPDATE_MY_GROUPS({idx, updated}: {idx: number; updated: IGroup}) {
    Object.assign(this.myGroups[idx], updated);
  }

  @Mutation
  DELETE_FROM_MY_GROUPS(group: IGroup) {
    this.myGroups.splice(this.myGroups.indexOf(group), 1);
  }

  @Mutation
  ADD_TO_ALL_GROUPS(added: IGroup) {
    this.allGroups.push(added);
  }

  @Mutation
  UPDATE_ALL_GROUPS({idx, updated}: {idx: number; updated: IGroup}) {
    Object.assign(this.allGroups[idx], updated);
  }

  @Mutation
  DELETE_FROM_ALL_GROUPS(group: IGroup) {
    this.allGroups.splice(this.allGroups.indexOf(group), 1);
  }

  @Action
  public async UpdateGroup(group: IGroup) {
    const myGroupId = this.myGroups.findIndex((g) => g.id === group.id);
    if (myGroupId !== -1) {
      this.UPDATE_MY_GROUPS({idx: myGroupId, updated: group});
    } else {
      this.ADD_TO_MY_GROUPS(group);
    }

    const allGroupsId = this.allGroups.findIndex((g) => g.id === group.id);
    if (allGroupsId !== -1) {
      this.UPDATE_ALL_GROUPS({idx: allGroupsId, updated: group});
    } else {
      this.ADD_TO_ALL_GROUPS(group);
    }
  }

  @Action
  public async DeleteGroup(group: IGroup): Promise<IGroup> {
    return axios.delete<IGroup>(`/groups/${group.id}`).then(({data}) => {
      this.DELETE_FROM_ALL_GROUPS(group);
      this.DELETE_FROM_MY_GROUPS(group);
      return data;
    });
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
    });
  }

  @Action
  public async FetchMyGroups() {
    this.FetchEndpoint('/groups/my').then(({data}) => {
      this.context.commit('SET_MY_GROUPS', data);
    });
  }

  @Action
  async FetchEndpoint(endpoint: string): Promise<AxiosResponse<IGroup[]>> {
    return axios.get<IGroup[]>(endpoint);
  }
}

export const GroupsModule = getModule(Groups);
