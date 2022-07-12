import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import { Checklist, ChecklistVuln } from '../types/checklist/control';
import { FileID } from './report_intake';

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'checklistFilteredData'
})
export class ChecklistFilteredData extends VuexModule {
  /** State var containing all Checklists that have been added */
  loadedChecklists: Checklist[] = [];

  selectedChecklistIDs: FileID[] = [];

  selectedControl: ChecklistVuln | null = null;

  /** Return all of the files that we currently have. */
  get allFiles(): Checklist[] {
    const result: Checklist[] = [];
    result.push(...this.loadedChecklists);
    return result;
  }

  @Action
  public selectRule(ruleId: string): void {
    this.context.commit('SELECT_RULE', { ruleId });
  }

  @Mutation
  SELECT_RULE(options: { ruleId: string }) {
    const rulesList: ChecklistVuln[] = [];
    Object.entries(FilteredChecklistDataModule.loadedChecklists)
      .map(([_fileId, checklist]) => checklist.vulns)
      .forEach((rulesItems) => {
        rulesList.push(...rulesItems);
      });
    const foundControl = rulesList?.find(
      (vuln) => vuln.ruleId === options.ruleId
    );
    if (foundControl) {
      this.selectedControl = foundControl;
    } else {
      throw new Error(`Invalid Vulnerability - Rule ID: ${options.ruleId}`);
    }
  }

  /**
   * Adds an execution file to the store.
   * @param newExecution The execution to add
   */
  @Mutation
  addExecution(newExecution: Checklist) {
    this.loadedChecklists.push(newExecution);
  }
}

export const FilteredChecklistDataModule = getModule(ChecklistFilteredData);
