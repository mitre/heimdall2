import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

export interface IChecklistSupplementalInfo {
  show: boolean;
  xmlString: string;
  filename: string;
  multiple: boolean;
  numOfObj: number;
  intakeType: 'split' | 'wrapper' | 'default';
  mode: 'view' | 'edit';
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'ChecklistSupplementalInfoModule'
})
export class ChecklistSupplementalInfo extends VuexModule {
  visibility = false;
  xmlString = '';
  filename = '';
  multiple = false;
  numOfObj = 0;
  intakeType: IChecklistSupplementalInfo['intakeType'] = 'default';
  mode: IChecklistSupplementalInfo['mode'] = 'view';

  @Action
  show(info: {fname: string; data: string}) {
    this.context.commit('SET_FILENAME', info.fname);
    this.context.commit('SET_XMLSTRING', info.data);
    this.detectMultipleStigs(info.data);
    this.context.commit('SET_SHOW', true);
  }

  @Action
  detectMultipleStigs(data: string) {
    const numberOfObj = data.match(/<iSTIG>|<\/iSTIG>/g) || [];
    if (numberOfObj.length > 1) {
      this.context.commit('SET_NUMOFOBJ', numberOfObj.length);
      this.context.commit('SET_MULTIPLE', true);
    }
  }

  @Action
  resetState(): void {
    this.context.commit('SET_FILENAME', '');
    this.context.commit('SET_XMLSTRING', '');
    this.context.commit('SET_MULTIPLE', false);
    this.context.commit('SET_INTAKE', 'default');
    this.context.commit('SET_NUMOFOBJ', 0);
  }

  @Action
  close(): void {
    this.context.commit('SET_SHOW', false);
  }

  @Mutation
  SET_FILENAME(name: string) {
    this.filename = name;
  }

  @Mutation
  SET_SHOW(visibility: boolean) {
    this.visibility = visibility;
  }

  @Mutation
  SET_MULTIPLE(found: boolean) {
    this.multiple = found;
  }

  @Mutation
  SET_XMLSTRING(data: string) {
    this.xmlString = data;
  }

  @Mutation
  SET_INTAKE(type: IChecklistSupplementalInfo['intakeType']) {
    this.intakeType = type;
  }

  @Mutation
  SET_NUMOFOBJ(num: number) {
    this.numOfObj = num;
  }
}

export const ChecklistSupplementalInfoModule = getModule(
  ChecklistSupplementalInfo
);
