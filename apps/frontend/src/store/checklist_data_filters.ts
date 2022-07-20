import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import { ChecklistFile, ChecklistVuln } from '../types/checklist/control';
import { InspecDataModule } from './data_store';
import { FileID } from './report_intake';

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'checklistFilteredData'
})
export class ChecklistFilteredData extends VuexModule {
  selectedChecklistIDs: FileID[] = [];

  selectedControl: ChecklistVuln | null = null;

  @Action
  public selectRule(ruleId: string): void {
    this.context.commit('SELECT_RULE', { ruleId });
  }

  get allFiles() {
    return InspecDataModule.allChecklistFiles
  }

  // @Mutation
  // SELECT_RULE(options: { ruleId: string }) {
  //   const rulesList: ChecklistVuln[] = [];
  //   Object.entries(FilteredChecklistDataModule.loadedChecklists)
  //     .map(([_fileId, checklist]) => checklist.vulns)
  //     .forEach((rulesItems) => {
  //       rulesList.push(...rulesItems);
  //     });
  //   const foundControl = rulesList?.find(
  //     (vuln) => vuln.ruleId === options.ruleId
  //   );
  //   if (foundControl) {
  //     this.selectedControl = foundControl;
  //   } else {
  //     throw new Error(`Invalid Vulnerability - Rule ID: ${options.ruleId}`);
  //   }
  // }
}

export const FilteredChecklistDataModule = getModule(ChecklistFilteredData);
