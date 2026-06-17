import type { IGroup } from '@heimdall/common/interfaces';
import axios, { AxiosResponse } from 'axios';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule,
} from 'vuex-module-decorators';
import Store from '@/store/store';

export type IGroupState = {
  allGroups: IGroup[];
  myGroups: IGroup[];
};

@Module({
  dynamic: true,
  name: 'GroupsModule',
  namespaced: true,
  store: Store,
})
export class Groups extends VuexModule implements IGroupState {
  allGroups: IGroup[] = [];
  loading = true;
  myGroups: IGroup[] = [];

  @Mutation
  ADD_TO_ALL_GROUPS(added: IGroup) {
    this.allGroups.push(added);
  }

  @Mutation
  ADD_TO_MY_GROUPS(added: IGroup) {
    this.myGroups.push(added);
  }

  @Mutation
  DELETE_FROM_ALL_GROUPS(group: IGroup) {
    this.allGroups.splice(this.allGroups.indexOf(group), 1);
  }

  @Mutation
  DELETE_FROM_MY_GROUPS(group: IGroup) {
    this.myGroups.splice(this.myGroups.indexOf(group), 1);
  }

  @Action
  public async DeleteGroup(group: IGroup): Promise<IGroup> {
    return axios.delete<IGroup>(`/groups/${group.id}`).then(({ data }) => {
      this.DELETE_FROM_ALL_GROUPS(group);
      this.DELETE_FROM_MY_GROUPS(group);
      return data;
    });
  }

  @Action
  public async FetchAllGroups() {
    this.FetchEndpoint('/groups').then(({ data }) => {
      this.context.commit('SET_ALL_GROUPS', data);
    });
  }

  @Action
  async FetchEndpoint(endpoint: string): Promise<AxiosResponse<IGroup[]>> {
    return axios.get<IGroup[]>(endpoint);
  }

  @Action
  public async FetchGroupData() {
    this.FetchAllGroups();
    this.FetchMyGroups();
    this.context.commit('SET_LOADING', false);
  }

  @Action
  public async FetchMyGroups() {
    this.FetchEndpoint('/groups/my').then(({ data }) => {
      this.context.commit('SET_MY_GROUPS', data);
    });
  }

  @Mutation
  SET_ALL_GROUPS(groups: IGroup[]) {
    this.allGroups = groups;
  }

  @Mutation
  SET_LOADING(loading: boolean) {
    this.loading = loading;
  }

  @Mutation
  SET_MY_GROUPS(groups: IGroup[]) {
    this.myGroups = groups;
  }

  @Mutation
  UPDATE_ALL_GROUPS({ idx, updated }: { idx: number; updated: IGroup }) {
    Object.assign(this.allGroups[idx], updated);
  }

  @Mutation
  UPDATE_MY_GROUPS({ idx, updated }: { idx: number; updated: IGroup }) {
    Object.assign(this.myGroups[idx], updated);
  }

  @Action
  public async UpdateGroup(group: IGroup) {
    const myGroupId = this.myGroups.findIndex(g => g.id === group.id);
    if (myGroupId === -1) {
      this.ADD_TO_MY_GROUPS(group);
    } else {
      this.UPDATE_MY_GROUPS({ idx: myGroupId, updated: group });
    }

    const allGroupsId = this.allGroups.findIndex(g => g.id === group.id);
    if (allGroupsId === -1) {
      this.ADD_TO_ALL_GROUPS(group);
    } else {
      this.UPDATE_ALL_GROUPS({ idx: allGroupsId, updated: group });
    }
  }

  @Action
  public async UpdateGroupById(id: string) {
    const group = (await axios.get<IGroup>(`/groups/${id}`)).data;
    await this.UpdateGroup(group);
  }
}

export const GroupsModule = getModule(Groups);
