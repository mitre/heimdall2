import Store from '@/store/store';
import {IGroup} from '@heimdall/common/interfaces';
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
    const target = this.myGroups.at(idx);
    if (target === undefined) {
      // The old blind index made Object.assign throw here too — stated now.
      throw new TypeError(`No group at index ${idx} to update`);
    }
    Object.assign(target, updated);
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
    const target = this.allGroups.at(idx);
    if (target === undefined) {
      // The old blind index made Object.assign throw here too — stated now.
      throw new TypeError(`No group at index ${idx} to update`);
    }
    Object.assign(target, updated);
  }

  @Mutation
  DELETE_FROM_ALL_GROUPS(group: IGroup) {
    this.allGroups.splice(this.allGroups.indexOf(group), 1);
  }

  // @Action wraps the body in dispatch, so Promise<void> is the truthful
  // signature even though nothing inside awaits.
  @Action
  public UpdateGroup(group: IGroup): Promise<void> {
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
    return Promise.resolve();
  }

  @Action
  public async UpdateGroupById(id: string) {
    const group = (await axios.get<IGroup>(`/groups/${id}`)).data;
    await this.UpdateGroup(group);
  }

  @Action
  public async DeleteGroup(group: IGroup): Promise<IGroup> {
    const {data} = await axios.delete<IGroup>(`/groups/${group.id}`);
    this.DELETE_FROM_ALL_GROUPS(group);
    this.DELETE_FROM_MY_GROUPS(group);
    return data;
  }

  @Action
  public async FetchGroupData() {
    // Awaited: the loading flag used to flip off before either fetch had
    // completed, so the UI reported ready while the lists were still empty.
    await Promise.all([this.FetchAllGroups(), this.FetchMyGroups()]);
    this.context.commit('SET_LOADING', false);
  }

  @Action
  public async FetchAllGroups() {
    const {data} = await this.FetchEndpoint('/groups');
    this.context.commit('SET_ALL_GROUPS', data);
  }

  @Action
  public async FetchMyGroups() {
    const {data} = await this.FetchEndpoint('/groups/my');
    this.context.commit('SET_MY_GROUPS', data);
  }

  @Action
  async FetchEndpoint(endpoint: string): Promise<AxiosResponse<IGroup[]>> {
    return axios.get<IGroup[]>(endpoint);
  }
}

export const GroupsModule = getModule(Groups);
