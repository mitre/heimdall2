import Store from '@/store/store';
import {IGroupRelation} from '@heimdall/interfaces';
import axios, {AxiosResponse} from 'axios';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'GroupRelationsModule'
})
export class GroupRelations extends VuexModule {
  allGroupRelations: IGroupRelation[] = [];
  loading = true;

  @Mutation
  SET_ALL_GROUP_RELATIONS(groupRelations: IGroupRelation[]) {
    this.allGroupRelations = groupRelations;
  }

  @Mutation
  SET_LOADING(loading: boolean) {
    this.loading = loading;
  }

  @Mutation
  ADD_TO_ALL_GROUP_RELATIONS(added: IGroupRelation) {
    this.allGroupRelations.push(added);
  }

  @Mutation
  UPDATE_ALL_GROUP_RELATIONS({
    idx,
    updated
  }: {
    idx: number;
    updated: IGroupRelation;
  }) {
    Object.assign(this.allGroupRelations[idx], updated);
  }

  @Mutation
  DELETE_FROM_ALL_GROUP_RELATIONS(groupRelation: IGroupRelation) {
    this.allGroupRelations.splice(
      this.allGroupRelations.indexOf(groupRelation),
      1
    );
  }

  @Action
  public async UpdateGroupRelation(groupRelation: IGroupRelation) {
    const groupRelationId = this.allGroupRelations.findIndex(
      (g) => g.id === groupRelation.id
    );
    if (groupRelationId !== -1) {
      this.UPDATE_ALL_GROUP_RELATIONS({
        idx: groupRelationId,
        updated: groupRelation
      });
    } else {
      this.ADD_TO_ALL_GROUP_RELATIONS(groupRelation);
    }
  }

  @Action
  public async UpdateGroupRelationById(id: string) {
    const groupRelation = (
      await axios.get<IGroupRelation>(`/group-relations/${id}`)
    ).data;
    await this.UpdateGroupRelation(groupRelation);
  }

  @Action
  public async DeleteGroupRelation(
    groupRelation: IGroupRelation
  ): Promise<IGroupRelation> {
    return axios
      .delete<IGroupRelation>(`/group-relations/${groupRelation.id}`)
      .then(({data}) => {
        this.DELETE_FROM_ALL_GROUP_RELATIONS(groupRelation);
        return data;
      });
  }

  @Action
  public async FetchGroupRelationData() {
    this.FetchEndpoint('/group-relations').then(({data}) => {
      this.context.commit('SET_ALL_GROUP_RELATIONS', data);
    });
    this.context.commit('SET_LOADING', false);
  }

  @Action
  async FetchEndpoint(
    endpoint: string
  ): Promise<AxiosResponse<IGroupRelation[]>> {
    return axios.get<IGroupRelation[]>(endpoint);
  }

  @Action
  public async GetAllDescendants(
    parentId: string
  ): Promise<AxiosResponse<string[]>> {
    const allDescendants = await axios.get<string[]>(
      `/group-relations/all-descendants/${parentId}`
    );
    return allDescendants;
  }

  @Action
  public async GetAdjacentDescendants(
    parentId: string
  ): Promise<AxiosResponse<string[]>> {
    return axios.get<string[]>(
      `/group-relations/adjacent-descendants/${parentId}`
    );
  }
}

export const GroupRelationsModule = getModule(GroupRelations);
