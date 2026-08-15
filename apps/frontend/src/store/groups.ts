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
    if (myGroupId === -1) {
      this.ADD_TO_MY_GROUPS(group);
    } else {
      this.UPDATE_MY_GROUPS({idx: myGroupId, updated: group});
    }

    const allGroupsId = this.allGroups.findIndex((g) => g.id === group.id);
    if (allGroupsId === -1) {
      this.ADD_TO_ALL_GROUPS(group);
    } else {
      this.UPDATE_ALL_GROUPS({idx: allGroupsId, updated: group});
    }
    return Promise.resolve();
  }

  @Action
  public async UpdateGroupById(id: string) {
    const {data: group} = await axios.get<IGroup>(`/groups/${id}`);
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
    // Re-entered on every fetch: the flag initializes true and used to be
    // cleared exactly once, so every refetch after the first rendered
    // "loaded, empty" while the lists were still in flight.
    this.context.commit('SET_LOADING', true);
    // Settled rather than fail-fast: one list rejecting must not discard the
    // other, and must not propagate out of GetUserInfo to deny a session
    // (ADR-008). The flag still flips only after both have finished, which is
    // the defect 14c13a0e9 fixed — that intent is preserved, not reverted.
    await Promise.allSettled([this.FetchAllGroups(), this.FetchMyGroups()]);
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
