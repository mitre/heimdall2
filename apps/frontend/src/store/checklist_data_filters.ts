import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import {Checklist, ChecklistVuln} from '../types/checklist/control';
import {FileID} from './report_intake';

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'checklistFilteredData'
})
export class ChecklistFilteredData extends VuexModule {
  loadedChecklists: Record<FileID, Checklist> = {};

  selectedChecklistIDs: FileID[] = [];

  selectedControl: ChecklistVuln | null = null;

  @Action
  public selectRule(fileId: string, ruleId: string): void {
    this.context.commit('SELECT_RULE', {fileId, ruleId});
  }

  @Mutation
  SELECT_RULE(options: {fileId: FileID; ruleId: string}) {
    const foundControl = this.loadedChecklists[options.fileId].vulns.find(
      (vuln) => vuln.ruleId === options.ruleId
    );
    if (foundControl) {
      this.selectedControl = foundControl;
    } else {
      throw new Error(`Invalid Vulnerability - Rule ID: ${options.ruleId}`);
    }
  }
}

export const FilteredChecklistDataModule = getModule(ChecklistFilteredData);
