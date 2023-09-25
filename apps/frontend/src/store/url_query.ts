import Store from '@/store/store';
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
  name: 'UrlQueryModule'
})
export class UrlQuery extends VuexModule {
  database: string[] = [];
  group: string[] = [];

  get existsInDatabaseQuery(): (databaseValue: string) => boolean {
    return (databaseValue: string) => {
      return this.database.includes(databaseValue);
    };
  }

  get existsInGroupQuery(): (groupValue: string) => boolean {
    return (groupValue: string) => {
      return this.group.includes(groupValue);
    };
  }

  @Action
  addGroupQueryParam(group: string) {
    this.context.commit('ADD_GROUP', group);
  }

  @Action
  removeGroupQueryParam(group: string) {
    this.context.commit('REMOVE_GROUP', group);
  }

  @Mutation
  ADD_GROUP(group: string) {
    if (!this.group.includes(group)) {
      this.group.push(group);
    }
  }

  @Mutation
  REMOVE_GROUP(group: string) {
    this.group = this.group.filter((item) => item !== group);
  }

  @Mutation
  CLEAR_GROUP() {
    this.group = [];
  }

  @Action
  addDatabaseQueryParam(database: string) {
    this.context.commit('ADD_DATABASE', database);
  }

  @Action
  removeDatabaseQueryParam(database: string) {
    this.context.commit('REMOVE_DATABASE', database);
  }

  @Mutation
  ADD_DATABASE(database: string) {
    if (!this.database.includes(database)) {
      this.database.push(database);
    }
  }

  @Mutation
  REMOVE_DATABASE(database: string) {
    this.database = this.database.filter((item) => item !== database);
  }

  @Mutation
  CLEAR_DATABASE() {
    this.database = [];
  }

  @Action
  clearQueryParams() {
    this.context.commit('CLEAR_GROUP');
    this.context.commit('CLEAR_DATABASE');
  }
}

export const UrlQueryModule = getModule(UrlQuery);
